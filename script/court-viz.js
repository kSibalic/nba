// Court Visualization Script
class CourtVisualization {
    constructor() {
        this.data = [];
        this.selectedPlayer = null;
        this.init();
    }

    async init() {
        try {
            await this.loadData();
            this.populatePlayerSelect();
            this.createCourt();
            this.setupEventListeners();
            this.showContent();
        } catch (error) {
            console.error('Error initializing court visualization:', error);
            this.showError(error.message);
        }
    }

    async loadData() {
        try {
            const regularData = await d3.dsv(';', '../data/regular.csv');
            this.data = this.cleanData(regularData);
            console.log('Data loaded:', this.data.length, 'players');
        } catch (error) {
            throw new Error('Failed to load CSV data');
        }
    }

    cleanData(data) {
        const numericFields = ['FG', 'FGA', 'FG%', '3P', '3PA', '3P%', '2P', '2PA', '2P%', 'PTS'];
        
        return data.map(d => {
            const cleaned = { ...d };
            numericFields.forEach(field => {
                const value = parseFloat(cleaned[field]);
                cleaned[field] = isNaN(value) ? 0 : value;
            });
            cleaned.Player = cleaned.Player || 'Unknown';
            return cleaned;
        });
    }

    populatePlayerSelect() {
        const select = document.getElementById('playerSelect');
        const players = [...new Set(this.data.map(p => p.Player))].sort();
        
        players.forEach(player => {
            const option = document.createElement('option');
            option.value = player;
            option.textContent = player;
            select.appendChild(option);
        });
    }

    createCourt() {
        const container = document.getElementById('court');
        const width = container.offsetWidth || 800;
        const height = 500;
        const margin = { top: 20, right: 20, bottom: 20, left: 20 };

        // Clear previous
        d3.select('#court').selectAll('*').remove();

        const svg = d3.select('#court')
            .append('svg')
            .attr('width', width)
            .attr('height', height)
            .style('background-color', '#1a1a1a');

        const court = svg.append('g')
            .attr('transform', `translate(${margin.left}, ${margin.top})`);

        const courtWidth = width - margin.left - margin.right;
        const courtHeight = height - margin.top - margin.bottom;

        // Court outline
        court.append('rect')
            .attr('x', 0)
            .attr('y', 0)
            .attr('width', courtWidth)
            .attr('height', courtHeight)
            .attr('fill', 'none')
            .attr('stroke', '#ffffff')
            .attr('stroke-width', 2);

        // Center circle
        court.append('circle')
            .attr('cx', courtWidth / 2)
            .attr('cy', courtHeight / 2)
            .attr('r', 40)
            .attr('fill', 'none')
            .attr('stroke', '#ffffff')
            .attr('stroke-width', 2);

        // Three-point arc (simplified)
        const arcRadius = courtWidth * 0.3;
        court.append('path')
            .attr('d', `M ${courtWidth * 0.1} ${courtHeight * 0.2} 
                       A ${arcRadius} ${arcRadius} 0 0 1 ${courtWidth * 0.1} ${courtHeight * 0.8}`)
            .attr('fill', 'none')
            .attr('stroke', '#ffffff')
            .attr('stroke-width', 2);

        // Free throw line
        court.append('line')
            .attr('x1', courtWidth * 0.15)
            .attr('y1', courtHeight * 0.4)
            .attr('x2', courtWidth * 0.15)
            .attr('y2', courtHeight * 0.6)
            .attr('stroke', '#ffffff')
            .attr('stroke-width', 2);

        // Paint area
        court.append('rect')
            .attr('x', 0)
            .attr('y', courtHeight * 0.35)
            .attr('width', courtWidth * 0.15)
            .attr('height', courtHeight * 0.3)
            .attr('fill', 'none')
            .attr('stroke', '#ffffff')
            .attr('stroke-width', 2);

        // Basket
        court.append('circle')
            .attr('cx', courtWidth * 0.05)
            .attr('cy', courtHeight / 2)
            .attr('r', 10)
            .attr('fill', 'none')
            .attr('stroke', '#ff6b6b')
            .attr('stroke-width', 3);

        this.court = court;
        this.courtWidth = courtWidth;
        this.courtHeight = courtHeight;
    }

    updateShots(player) {
        if (!this.court) return;

        // Remove existing shots
        this.court.selectAll('.shot').remove();

        const playerData = this.data.find(p => p.Player === player);
        if (!playerData) return;

        // Generate random shot locations based on shooting percentages
        const shots = this.generateShots(playerData);

        // Create tooltip
        const tooltip = d3.select('body').append('div')
            .attr('class', 'tooltip')
            .style('opacity', 0)
            .style('position', 'absolute')
            .style('background-color', 'rgba(0, 0, 0, 0.8)')
            .style('color', 'white')
            .style('padding', '10px')
            .style('border-radius', '5px')
            .style('pointer-events', 'none');

        // Add shots
        this.court.selectAll('.shot')
            .data(shots)
            .enter()
            .append('circle')
            .attr('class', 'shot')
            .attr('cx', d => d.x)
            .attr('cy', d => d.y)
            .attr('r', 5)
            .attr('fill', d => d.made ? '#00ff88' : '#ff6b6b')
            .attr('fill-opacity', 0.7)
            .attr('stroke', d => d.made ? '#00ff88' : '#ff6b6b')
            .attr('stroke-width', 1)
            .on('mouseover', function(event, d) {
                d3.select(this)
                    .transition()
                    .duration(200)
                    .attr('r', 8)
                    .attr('fill-opacity', 1);
                
                tooltip.transition()
                    .duration(200)
                    .style('opacity', .9);
                tooltip.html(`${d.type}<br/>${d.made ? 'Made' : 'Missed'}`)
                    .style('left', (event.pageX + 10) + 'px')
                    .style('top', (event.pageY - 28) + 'px');
            })
            .on('mouseout', function(event, d) {
                d3.select(this)
                    .transition()
                    .duration(200)
                    .attr('r', 5)
                    .attr('fill-opacity', 0.7);
                
                tooltip.transition()
                    .duration(500)
                    .style('opacity', 0);
            });

        // Update statistics
        this.updateStats(playerData);
    }

    generateShots(playerData) {
        const shots = [];
        const numShots = 50;

        // Calculate shot distribution
        const twoPA = playerData['2PA'] || 0;
        const threePA = playerData['3PA'] || 0;
        const totalAttempts = twoPA + threePA;
        
        if (totalAttempts === 0) return shots;

        const threeProportion = threePA / totalAttempts;

        for (let i = 0; i < numShots; i++) {
            const isThree = Math.random() < threeProportion;
            const made = Math.random() < (isThree ? playerData['3P%'] : playerData['2P%']);

            let x, y;
            if (isThree) {
                // Three-point shots (further from basket)
                const angle = Math.random() * Math.PI - Math.PI / 2;
                const distance = this.courtWidth * 0.25 + Math.random() * this.courtWidth * 0.15;
                x = this.courtWidth * 0.05 + distance * Math.cos(angle);
                y = this.courtHeight / 2 + distance * Math.sin(angle);
            } else {
                // Two-point shots (closer to basket)
                x = Math.random() * this.courtWidth * 0.3;
                y = this.courtHeight * 0.3 + Math.random() * this.courtHeight * 0.4;
            }

            shots.push({
                x: Math.max(0, Math.min(this.courtWidth, x)),
                y: Math.max(0, Math.min(this.courtHeight, y)),
                made: made,
                type: isThree ? '3-Pointer' : '2-Pointer'
            });
        }

        return shots;
    }

    updateStats(playerData) {
        document.getElementById('fgPercentage').textContent = 
            playerData['FG%'] > 0 ? (playerData['FG%'] * 100).toFixed(1) + '%' : '0.0%';
        
        document.getElementById('threePercentage').textContent = 
            playerData['3P%'] > 0 ? (playerData['3P%'] * 100).toFixed(1) + '%' : '0.0%';
        
        document.getElementById('pointsPerGame').textContent = 
            playerData.PTS > 0 ? playerData.PTS.toFixed(1) : '0.0';
    }

    setupEventListeners() {
        const playerSelect = document.getElementById('playerSelect');
        playerSelect.addEventListener('change', (e) => {
            const player = e.target.value;
            if (player) {
                this.selectedPlayer = player;
                this.updateShots(player);
            } else {
                this.court.selectAll('.shot').remove();
                this.updateStats({});
            }
        });
    }

    showContent() {
        document.getElementById('loading').style.display = 'none';
        document.getElementById('datasets').style.display = 'grid';
    }

    showError(message) {
        document.getElementById('loading').style.display = 'none';
        const errorDiv = document.getElementById('error');
        errorDiv.style.display = 'block';
        errorDiv.textContent = message;
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new CourtVisualization();
});