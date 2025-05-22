import { DataLoader } from './utils/data-loader.js';
import { UIUtils } from './utils/ui-utils.js';
import { StatsTablePage } from './pages/stats-table.js';
import { CourtVisualization } from './pages/court-visualization.js';
import { GraphsPage } from './pages/graphs.js';
import { DiagramsPage } from './pages/diagrams.js';

document.addEventListener('DOMContentLoaded', async () => {
    try {
        UIUtils.enhanceLoadingAnimation();

        const { regularData, playoffData } = await DataLoader.loadData();

        new StatsTablePage(regularData, playoffData);
        new CourtVisualization(regularData);
        new GraphsPage(regularData);
        new DiagramsPage(regularData);

        UIUtils.addRowHoverEffects();
    } catch (error) {
        console.error('Error initializing application:', error);
        UIUtils.showError('Failed to load data. Please check if the CSV files are available.');
    }
});


// File: visualizations.js
class BasketballVisualizer {
    constructor() {
        this.regularData = [];
        this.playoffData = [];
        this.teamData = { averages: {}, players: {}, stats: {} };
        this.init();
    }

    async init() {
        try {
            await this.loadData();
            if (!this.regularData.length || !this.playoffData.length) throw new Error('Data missing.');

            this.processData();
            this.populateDropdowns();
            this.initializeVisualizations();
            this.setupEventListeners();
            this.showContent();
        } catch (error) {
            this.showError(error);
        }
    }

    async loadData() {
        const [regularCsv, playoffCsv] = await Promise.all([
            d3.dsv(';', '../data/regular.csv'),
            d3.dsv(';', '../data/playoff.csv')
        ]);

        if (!regularCsv || !playoffCsv) throw new Error('CSV files failed to load.');
        this.regularData = regularCsv;
        this.playoffData = playoffCsv;
    }

    processData() {
        this.regularData = this.cleanData(this.regularData);
        this.playoffData = this.cleanData(this.playoffData);
        this.processTeamData();
    }

    cleanData(data) {
        const numericFields = ['Rk', 'Age', 'G', 'GS', 'MP', 'FG', 'FGA', 'FG%', '3P', '3PA', '3P%', 
                               '2P', '2PA', '2P%', 'eFG%', 'FT', 'FTA', 'FT%', 'ORB', 'DRB', 'TRB', 
                               'AST', 'STL', 'BLK', 'TOV', 'PF', 'PTS'];
        return data.map(d => {
            const cleaned = { ...d };
            numericFields.forEach(field => {
                const value = parseFloat(cleaned[field]);
                cleaned[field] = isNaN(value) ? 0 : value;
            });
            cleaned.Player = cleaned.Player || 'Unknown';
            cleaned.Pos = cleaned.Pos || 'N/A';
            cleaned.Tm = cleaned.Tm || 'N/A';
            return cleaned;
        });
    }

    processTeamData() {
        this.regularData.forEach(player => {
            const team = player.Tm;
            const points = player.PTS;

            if (!this.teamData.stats[team]) {
                this.teamData.stats[team] = { totalPoints: 0, totalPlayers: 0, averagePoints: 0 };
            }

            this.teamData.stats[team].totalPoints += points;
            this.teamData.stats[team].totalPlayers++;
            this.teamData.stats[team].averagePoints = this.teamData.stats[team].totalPoints / this.teamData.stats[team].totalPlayers;
        });

        Object.entries(this.teamData.stats).forEach(([team, stats]) => {
            this.teamData.averages[team] = stats.averagePoints;
            this.teamData.players[team] = stats.totalPlayers;
        });
    }

    populateDropdowns() {
        const dropdowns = {
            playerSelect: [...new Set(this.regularData.map(p => p.Player))].sort(),
            teamSelect: [...new Set(this.regularData.map(p => p.Tm))].sort(),
            shotTypeSelect: ['All Shots', '2-Pointers', '3-Pointers', 'Free Throws']
        };

        Object.entries(dropdowns).forEach(([id, options]) => {
            const select = document.getElementById(id);
            if (select) {
                options.forEach(option => {
                    const element = document.createElement('option');
                    element.value = option;
                    element.textContent = option;
                    select.appendChild(element);
                });
            }
        });
    }

    setupEventListeners() {
        const handlers = {
            playerSelect: () => this.updatePlayerVisualizations(document.getElementById('playerSelect')?.value),
            teamSelect: () => this.updateTeamVisualizations(document.getElementById('teamSelect')?.value),
            shotTypeSelect: () => this.updateShotData(document.getElementById('playerSelect')?.value)
        };

        Object.entries(handlers).forEach(([id, handler]) => {
            const element = document.getElementById(id);
            if (element) element.addEventListener('change', handler);
        });
    }

    initializeVisualizations() {
        const page = window.location.pathname.split('/').pop();
        if (page === 'diagrams.html') this.initializeDiagrams();
        if (page === 'graphs.html') this.initializeGraphs();
        if (page === 'visual-court.html') this.initializeCourt();
    }

    showContent() {
        document.getElementById('loading')?.style.display = 'none';
        document.getElementById('datasets')?.style.display = 'grid';
    }

    showError(error) {
        console.error('Error:', error);
        document.getElementById('loading')?.style.display = 'none';
        const errDiv = document.getElementById('error');
        if (errDiv) {
            errDiv.style.display = 'block';
            errDiv.textContent = error.message || 'An error occurred.';
        }
    }
}

document.addEventListener('DOMContentLoaded', () => new BasketballVisualizer());