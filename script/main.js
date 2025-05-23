// Main application script
class BasketballApp {
    constructor() {
        this.regularData = [];
        this.playoffData = [];
        this.init();
    }

    async init() {
        try {
            console.log('Initializing Basketball App...');
            await this.loadData();
            this.processData();
            this.renderTables();
            this.renderSummaries();
            this.addInteractivity();
            this.showContent();
        } catch (error) {
            console.error('Error initializing app:', error);
            this.showError(error.message);
        }
    }

    async loadData() {
        try {
            console.log('Loading CSV files...');
            
            // Load both CSV files using D3 with semicolon delimiter
            const [regularCsv, playoffCsv] = await Promise.all([
                d3.dsv(';', 'data/regular.csv'),
                d3.dsv(';', 'data/playoff.csv')
            ]);

            if (!regularCsv || !playoffCsv) {
                throw new Error('Failed to load CSV files');
            }

            this.regularData = this.cleanData(regularCsv);
            this.playoffData = this.cleanData(playoffCsv);
            
            console.log('Data loaded successfully:', {
                regular: this.regularData.length,
                playoff: this.playoffData.length
            });
        } catch (error) {
            console.error('Error loading CSV files:', error);
            throw new Error('Failed to load CSV data. Please ensure the files exist in data/ folder.');
        }
    }

    cleanData(data) {
        const numericFields = ['Rk', 'Age', 'G', 'GS', 'MP', 'FG', 'FGA', 'FG%', '3P', '3PA', '3P%', 
                             '2P', '2PA', '2P%', 'eFG%', 'FT', 'FTA', 'FT%', 'ORB', 'DRB', 'TRB', 
                             'AST', 'STL', 'BLK', 'TOV', 'PF', 'PTS'];
        
        return data.map(d => {
            const cleaned = { ...d };
            
            numericFields.forEach(field => {
                if (cleaned[field] !== undefined && cleaned[field] !== '' && cleaned[field] !== null) {
                    const value = parseFloat(cleaned[field]);
                    cleaned[field] = isNaN(value) ? 0 : value;
                } else {
                    cleaned[field] = 0;
                }
            });

            // Clean string fields
            cleaned.Player = cleaned.Player || 'Unknown';
            cleaned.Pos = cleaned.Pos || 'N/A';
            cleaned.Tm = cleaned.Tm || 'N/A';

            return cleaned;
        });
    }

    processData() {
        // Take first 20 players from each dataset
        this.regularData = this.regularData.slice(0, 20);
        this.playoffData = this.playoffData.slice(0, 20);
        
        console.log('Data processed:', {
            regular: this.regularData.length,
            playoff: this.playoffData.length
        });
    }

    renderTables() {
        this.renderTable('regular-table', this.regularData);
        this.renderTable('playoff-table', this.playoffData);
    }

    renderTable(tableId, data) {
        const tbody = d3.select(`#${tableId} tbody`);
        
        // Clear existing data
        tbody.selectAll('tr').remove();
        
        const rows = tbody.selectAll('tr')
            .data(data)
            .enter()
            .append('tr');

        rows.each(function(d, i) {
            const row = d3.select(this);
            
            // Add cells with formatted data
            row.append('td').text(d.Rk || '-');
            row.append('td').attr('class', 'player-name').text(d.Player || '-');
            row.append('td').html(`<span class="position">${d.Pos || '-'}</span>`);
            row.append('td').text(d.Age || '-');
            row.append('td').attr('class', 'team').text(d.Tm || '-');
            row.append('td').text(d.G || '-');
            row.append('td').text(d.MP > 0 ? d.MP.toFixed(1) : '-');
            row.append('td').text(d['FG%'] > 0 ? (d['FG%'] * 100).toFixed(1) + '%' : '-');
            row.append('td').text(d['3P%'] > 0 ? (d['3P%'] * 100).toFixed(1) + '%' : '-');
            row.append('td').text(d['FT%'] > 0 ? (d['FT%'] * 100).toFixed(1) + '%' : '-');
            row.append('td').text(d.TRB > 0 ? d.TRB.toFixed(1) : '-');
            row.append('td').text(d.AST > 0 ? d.AST.toFixed(1) : '-');
            row.append('td').text(d.PTS > 0 ? d.PTS.toFixed(1) : '-');
            
            // Add staggered animation delay
            row.style('animation-delay', `${0.1 + (i * 0.05)}s`);
        });
    }

    renderSummaries() {
        this.renderSummary('regular-summary', this.regularData, 'Regular Season');
        this.renderSummary('playoff-summary', this.playoffData, 'Playoffs');
    }

    renderSummary(containerId, data, title) {
        const container = d3.select(`#${containerId}`);
        
        // Clear existing data
        container.selectAll('.stat-card').remove();
        
        // Calculate summary statistics
        const validPts = data.filter(d => d.PTS > 0);
        const validReb = data.filter(d => d.TRB > 0);
        const validAst = data.filter(d => d.AST > 0);
        const validFG = data.filter(d => d['FG%'] > 0);
        
        const avgPts = validPts.length > 0 ? d3.mean(validPts, d => d.PTS) : 0;
        const avgReb = validReb.length > 0 ? d3.mean(validReb, d => d.TRB) : 0;
        const avgAst = validAst.length > 0 ? d3.mean(validAst, d => d.AST) : 0;
        const avgFG = validFG.length > 0 ? d3.mean(validFG, d => d['FG%']) : 0;

        const summaryData = [
            { label: 'Avg Points', value: avgPts > 0 ? avgPts.toFixed(1) : '0.0' },
            { label: 'Avg Rebounds', value: avgReb > 0 ? avgReb.toFixed(1) : '0.0' },
            { label: 'Avg Assists', value: avgAst > 0 ? avgAst.toFixed(1) : '0.0' },
            { label: 'Avg FG%', value: avgFG > 0 ? (avgFG * 100).toFixed(1) + '%' : '0.0%' }
        ];

        const cards = container.selectAll('.stat-card')
            .data(summaryData)
            .enter()
            .append('div')
            .attr('class', 'stat-card');

        cards.append('div')
            .attr('class', 'stat-value')
            .text(d => d.value);

        cards.append('div')
            .attr('class', 'stat-label')
            .text(d => d.label);
    }

    addInteractivity() {
        // Add row hover effects
        const rows = document.querySelectorAll('.stats-table tbody tr');
        
        rows.forEach((row) => {
            row.addEventListener('mouseenter', function() {
                this.style.transform = 'scale(1.02) translateZ(0)';
                this.style.boxShadow = '0 8px 25px rgba(0,0,0,0.15)';
            });
            
            row.addEventListener('mouseleave', function() {
                this.style.transform = 'scale(1) translateZ(0)';
                this.style.boxShadow = 'none';
            });
        });
    }

    showContent() {
        // Hide loading
        document.getElementById('loading').style.display = 'none';
        
        // Show datasets
        const datasets = document.getElementById('datasets');
        datasets.style.display = 'grid';
        
        // Trigger animations
        setTimeout(() => {
            document.querySelector('.regular-season').classList.add('slide-in-left');
            document.querySelector('.playoffs').classList.add('slide-in-right');
        }, 100);
    }

    showError(message) {
        document.getElementById('loading').style.display = 'none';
        const errorDiv = document.getElementById('error');
        errorDiv.style.display = 'block';
        errorDiv.textContent = message;
    }
}

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new BasketballApp();
});