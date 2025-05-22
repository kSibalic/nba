import { DataLoader } from '../utils/data-loader.js';
import { UIUtils } from '../utils/ui-utils.js';

export class StatsTablePage {
    constructor() {
        this.regularData = [];
        this.playoffData = [];
        this.init();
    }

    async init() {
        try {
            await this.loadData();
            this.processData();
            await this.renderTables();
            this.renderSummaries();
            UIUtils.showContent();
        } catch (error) {
            UIUtils.showError(error);
        }
    }

    async loadData() {
        const { regularData, playoffData } = await DataLoader.loadData();
        this.regularData = regularData;
        this.playoffData = playoffData;
    }

    processData() {
        console.log('Processing data...');
        
        // Get first 20 players from each dataset
        this.regularData = this.regularData.slice(0, 20);
        this.playoffData = this.playoffData.slice(0, 20);
        
        console.log('Processed regular data:', this.regularData.length, 'players');
        console.log('Processed playoff data:', this.playoffData.length, 'players');
    }

    async renderTables() {
        console.log('Rendering tables...');
        await this.renderTable('regular-table', this.regularData);
        await this.renderTable('playoff-table', this.playoffData);
    }

    async renderTable(tableId, data) {
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
            row.append('td').text(typeof d.MP === 'number' && d.MP > 0 ? d.MP.toFixed(1) : '-');
            row.append('td').text(typeof d['FG%'] === 'number' && d['FG%'] > 0 ? (d['FG%'] * 100).toFixed(1) + '%' : '-');
            row.append('td').text(typeof d['3P%'] === 'number' && d['3P%'] > 0 ? (d['3P%'] * 100).toFixed(1) + '%' : '-');
            row.append('td').text(typeof d['FT%'] === 'number' && d['FT%'] > 0 ? (d['FT%'] * 100).toFixed(1) + '%' : '-');
            row.append('td').text(typeof d.TRB === 'number' && d.TRB > 0 ? d.TRB.toFixed(1) : '-');
            row.append('td').text(typeof d.AST === 'number' && d.AST > 0 ? d.AST.toFixed(1) : '-');
            row.append('td').text(typeof d.PTS === 'number' && d.PTS > 0 ? d.PTS.toFixed(1) : '-');
            
            // Add staggered animation delay
            row.style('animation-delay', `${0.1 + (i * 0.05)}s`);
        });

        console.log(`Rendered ${data.length} rows for ${tableId}`);
    }

    renderSummaries() {
        console.log('Rendering summaries...');
        this.renderSummary('regular-summary', this.regularData, 'Regular Season');
        this.renderSummary('playoff-summary', this.playoffData, 'Playoffs');
    }

    renderSummary(containerId, data, title) {
        const container = d3.select(`#${containerId}`);
        
        // Clear existing data
        container.selectAll('.stat-card').remove();
        
        // Calculate summary statistics (excluding zeros for averages)
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

        console.log(`Rendered summary for ${title}:`, summaryData);
    }
} 