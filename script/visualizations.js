// Basketball Stats Visualizer
class BasketballVisualizer {
    constructor() {
        this.regularData = [];
        this.playoffData = [];
        this.teamData = {
            averages: {},
            players: {},
            stats: {}
        };
        this.init();
    }

    async init() {
        try {
            await this.loadData();
            if (!this.regularData.length || !this.playoffData.length) {
                throw new Error('Failed to load data. Please check your data files.');
            }
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
        try {
            console.log('Loading CSV files...');
            const [regularCsv, playoffCsv] = await Promise.all([
                d3.dsv(';', '../data/regular.csv'),
                d3.dsv(';', '../data/playoff.csv')
            ]);

            if (!regularCsv || !playoffCsv) {
                throw new Error('Failed to load CSV files');
            }

            this.regularData = regularCsv;
            this.playoffData = playoffCsv;
            console.log('Data loaded successfully:', this.regularData.length, 'regular season players');
        } catch (error) {
            console.error('Error loading data:', error);
            throw new Error('Failed to load data files. Please check if the files exist and are accessible.');
        }
    }

    processData() {
        if (!this.regularData || !this.playoffData) {
            throw new Error('No data available to process');
        }

        this.regularData = this.cleanData(this.regularData);
        this.playoffData = this.cleanData(this.playoffData);
        this.processTeamData();
    }

    processTeamData() {
        this.regularData.forEach(player => {
            if (!player.Tm || !player.PTS) return;

            const team = player.Tm;
            const points = parseFloat(player.PTS);

            if (isNaN(points) || points <= 0) return;

            if (!this.teamData.averages[team]) {
                this.teamData.averages[team] = 0;
                this.teamData.players[team] = 0;
                this.teamData.stats[team] = {
                    totalPoints: 0,
                    totalPlayers: 0,
                    averagePoints: 0
                };
            }

            this.teamData.stats[team].totalPoints += points;
            this.teamData.stats[team].totalPlayers++;
            this.teamData.stats[team].averagePoints = 
                this.teamData.stats[team].totalPoints / this.teamData.stats[team].totalPlayers;
        });

        Object.keys(this.teamData.stats).forEach(team => {
            const stats = this.teamData.stats[team];
            if (stats.totalPlayers > 0) {
                this.teamData.averages[team] = stats.averagePoints;
                this.teamData.players[team] = stats.totalPlayers;
            }
        });
    }

    cleanData(data) {
        if (!data || !Array.isArray(data)) return [];
        
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

            cleaned.Player = cleaned.Player || 'Unknown';
            cleaned.Pos = cleaned.Pos || 'N/A';
            cleaned.Tm = cleaned.Tm || 'N/A';

            return cleaned;
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
        const elements = {
            playerSelect: () => {
                const selectedPlayer = this.playerSelect?.value;
                if (selectedPlayer) {
                    this.updatePlayerVisualizations(selectedPlayer);
                    this.updateShotData(selectedPlayer);
                } else {
                    this.clearPlayerVisualizations();
                }
            },
            teamSelect: () => {
                const selectedTeam = this.teamSelect?.value;
                if (selectedTeam) {
                    this.updateTeamVisualizations(selectedTeam);
                } else {
                    this.clearTeamVisualizations();
                }
            },
            shotTypeSelect: () => {
                const selectedPlayer = this.playerSelect?.value;
                if (selectedPlayer) {
                    this.updateShotData(selectedPlayer);
                }
            }
        };

        Object.entries(elements).forEach(([id, handler]) => {
            const element = document.getElementById(id);
            if (element) {
                element.addEventListener('change', handler);
            }
        });
    }

    initializeVisualizations() {
        const currentPage = window.location.pathname.split('/').pop();
        const initializers = {
            'diagrams.html': () => this.initializeDiagrams(),
            'graphs.html': () => this.initializeGraphs(),
            'visual-court.html': () => this.initializeCourt()
        };

        try {
            const initializer = initializers[currentPage];
            if (initializer) {
                initializer();
                this.setupEventListeners();
                
                const playerSelect = document.getElementById('playerSelect');
                if (playerSelect?.value) {
                    this.updatePlayerVisualizations(playerSelect.value);
                }

                const teamSelect = document.getElementById('teamSelect');
                if (teamSelect?.value) {
                    this.updateTeamVisualizations(teamSelect.value);
                }
            } else {
                console.error('Unknown page:', currentPage);
            }
        } catch (error) {
            console.error('Error initializing visualizations:', error);
            this.showError(error);
        }
    }

    showContent() {
        const loading = document.getElementById('loading');
        const datasets = document.getElementById('datasets');
        
        if (loading) loading.style.display = 'none';
        if (datasets) datasets.style.display = 'grid';
    }

    showError(error) {
        console.error('Visualization error:', error);
        
        const loading = document.getElementById('loading');
        const errorDiv = document.getElementById('error');
        
        if (loading) loading.style.display = 'none';
        if (errorDiv) {
            errorDiv.style.display = 'block';
            errorDiv.textContent = error.message || 'An error occurred while loading the visualizations.';
        }
    }
}

// Initialize the visualizer when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    console.log('Initializing Basketball Visualizer...');
    new BasketballVisualizer();
}); 