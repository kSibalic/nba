export class DiagramsPage {
    constructor(data) {
        this.data = data;
        this.init();
    }

    init() {
        this.createPlayerComparison();
        this.createTeamComparison();
        this.createTrendAnalysis();
        this.setupEventListeners();
    }

    setupEventListeners() {
        const playerSelect = document.getElementById('playerSelect');
        if (playerSelect) {
            playerSelect.addEventListener('change', () => {
                const selectedPlayer = playerSelect.value;
                if (selectedPlayer) {
                    this.updatePlayerComparison(selectedPlayer);
                } else {
                    this.clearPlayerComparison();
                }
            });
        }

        const teamSelect = document.getElementById('teamSelect');
        if (teamSelect) {
            teamSelect.addEventListener('change', () => {
                const selectedTeam = teamSelect.value;
                if (selectedTeam) {
                    this.updateTeamComparison(selectedTeam);
                } else {
                    this.clearTeamComparison();
                }
            });
        }
    }

    createPlayerComparison() {
        if (!this.data || !this.data.length) {
            console.error('No data available for player comparison');
            return;
        }

        const margin = { top: 40, right: 100, bottom: 40, left: 60 };
        const container = document.getElementById('playerComparison');
        if (!container) {
            console.error('Player comparison container not found');
            return;
        }

        const width = container.offsetWidth - margin.left - margin.right;
        const height = 400 - margin.top - margin.bottom;

        // Clear previous visualization
        d3.select('#playerComparison').selectAll('*').remove();

        const svg = d3.select('#playerComparison')
            .append('svg')
            .attr('width', width + margin.left + margin.right)
            .attr('height', height + margin.top + margin.bottom)
            .append('g')
            .attr('transform', `translate(${margin.left},${margin.top})`);

        // Calculate player statistics
        const playerStats = this.data.map(player => ({
            player: player.Player,
            points: player.PTS,
            assists: player.AST,
            rebounds: player.TRB,
            efficiency: (player.PTS + player.AST + player.TRB) / 3
        }));

        // Sort by efficiency
        playerStats.sort((a, b) => b.efficiency - a.efficiency);

        // Take top 10 players
        const top10 = playerStats.slice(0, 10);

        const x = d3.scaleBand()
            .range([0, width])
            .domain(top10.map(d => d.player))
            .padding(0.1);

        const y = d3.scaleLinear()
            .range([height, 0])
            .domain([0, d3.max(top10, d => d.efficiency) * 1.1]);

        // Add X axis
        svg.append('g')
            .attr('transform', `translate(0,${height})`)
            .call(d3.axisBottom(x))
            .selectAll('text')
            .style('fill', '#ffffff')
            .attr('transform', 'rotate(-45)')
            .style('text-anchor', 'end');

        // Add Y axis
        svg.append('g')
            .call(d3.axisLeft(y))
            .selectAll('text')
            .style('fill', '#ffffff');

        // Add bars
        svg.selectAll('.bar')
            .data(top10)
            .enter()
            .append('rect')
            .attr('class', 'bar')
            .attr('x', d => x(d.player))
            .attr('y', d => y(d.efficiency))
            .attr('width', x.bandwidth())
            .attr('height', d => height - y(d.efficiency))
            .attr('fill', 'rgba(52, 152, 219, 0.7)')
            .attr('stroke', 'rgba(52, 152, 219, 1)')
            .attr('stroke-width', 1);
    }

    createTeamComparison() {
        if (!this.data || !this.data.length) {
            console.error('No data available for team comparison');
            return;
        }

        const margin = { top: 40, right: 100, bottom: 40, left: 60 };
        const container = document.getElementById('teamComparison');
        if (!container) {
            console.error('Team comparison container not found');
            return;
        }

        const width = container.offsetWidth - margin.left - margin.right;
        const height = 400 - margin.top - margin.bottom;

        // Clear previous visualization
        d3.select('#teamComparison').selectAll('*').remove();

        const svg = d3.select('#teamComparison')
            .append('svg')
            .attr('width', width + margin.left + margin.right)
            .attr('height', height + margin.top + margin.bottom)
            .append('g')
            .attr('transform', `translate(${margin.left},${margin.top})`);

        // Calculate team statistics
        const teams = {};
        this.data.forEach(player => {
            if (!teams[player.Team]) {
                teams[player.Team] = {
                    points: [],
                    assists: [],
                    rebounds: []
                };
            }
            teams[player.Team].points.push(player.PTS);
            teams[player.Team].assists.push(player.AST);
            teams[player.Team].rebounds.push(player.TRB);
        });

        const teamStats = Object.entries(teams).map(([team, stats]) => ({
            team,
            points: d3.mean(stats.points),
            assists: d3.mean(stats.assists),
            rebounds: d3.mean(stats.rebounds),
            efficiency: (d3.mean(stats.points) + d3.mean(stats.assists) + d3.mean(stats.rebounds)) / 3
        }));

        // Sort by efficiency
        teamStats.sort((a, b) => b.efficiency - a.efficiency);

        const x = d3.scaleBand()
            .range([0, width])
            .domain(teamStats.map(d => d.team))
            .padding(0.1);

        const y = d3.scaleLinear()
            .range([height, 0])
            .domain([0, d3.max(teamStats, d => d.efficiency) * 1.1]);

        // Add X axis
        svg.append('g')
            .attr('transform', `translate(0,${height})`)
            .call(d3.axisBottom(x))
            .selectAll('text')
            .style('fill', '#ffffff')
            .attr('transform', 'rotate(-45)')
            .style('text-anchor', 'end');

        // Add Y axis
        svg.append('g')
            .call(d3.axisLeft(y))
            .selectAll('text')
            .style('fill', '#ffffff');

        // Add bars
        svg.selectAll('.bar')
            .data(teamStats)
            .enter()
            .append('rect')
            .attr('class', 'bar')
            .attr('x', d => x(d.team))
            .attr('y', d => y(d.efficiency))
            .attr('width', x.bandwidth())
            .attr('height', d => height - y(d.efficiency))
            .attr('fill', (d, i) => i < 10 ? 'rgba(52, 152, 219, 0.7)' : 'rgba(231, 76, 60, 0.7)')
            .attr('stroke', (d, i) => i < 10 ? 'rgba(52, 152, 219, 1)' : 'rgba(231, 76, 60, 1)')
            .attr('stroke-width', 1);
    }

    createTrendAnalysis() {
        if (!this.data || !this.data.length) {
            console.error('No data available for trend analysis');
            return;
        }

        const margin = { top: 40, right: 100, bottom: 40, left: 60 };
        const container = document.getElementById('trendAnalysis');
        if (!container) {
            console.error('Trend analysis container not found');
            return;
        }

        const width = container.offsetWidth - margin.left - margin.right;
        const height = 400 - margin.top - margin.bottom;

        // Clear previous visualization
        d3.select('#trendAnalysis').selectAll('*').remove();

        const svg = d3.select('#trendAnalysis')
            .append('svg')
            .attr('width', width + margin.left + margin.right)
            .attr('height', height + margin.top + margin.bottom)
            .append('g')
            .attr('transform', `translate(${margin.left},${margin.top})`);

        // Calculate shooting trends
        const shootingTrends = this.data.map(player => ({
            player: player.Player,
            twoPointPercentage: player['2P%'],
            threePointPercentage: player['3P%'],
            freeThrowPercentage: player['FT%']
        }));

        // Sort by three-point percentage
        shootingTrends.sort((a, b) => b.threePointPercentage - a.threePointPercentage);

        // Take top 10 players
        const top10 = shootingTrends.slice(0, 10);

        const x = d3.scaleBand()
            .range([0, width])
            .domain(top10.map(d => d.player))
            .padding(0.1);

        const y = d3.scaleLinear()
            .range([height, 0])
            .domain([0, 1]);

        // Add X axis
        svg.append('g')
            .attr('transform', `translate(0,${height})`)
            .call(d3.axisBottom(x))
            .selectAll('text')
            .style('fill', '#ffffff')
            .attr('transform', 'rotate(-45)')
            .style('text-anchor', 'end');

        // Add Y axis
        svg.append('g')
            .call(d3.axisLeft(y))
            .selectAll('text')
            .style('fill', '#ffffff');

        // Add stacked bars
        const twoPointBars = svg.selectAll('.twoPoint')
            .data(top10)
            .enter()
            .append('rect')
            .attr('class', 'twoPoint')
            .attr('x', d => x(d.player))
            .attr('y', d => y(d.twoPointPercentage))
            .attr('width', x.bandwidth())
            .attr('height', d => height - y(d.twoPointPercentage))
            .attr('fill', 'rgba(52, 152, 219, 0.7)')
            .attr('stroke', 'rgba(52, 152, 219, 1)')
            .attr('stroke-width', 1);

        const threePointBars = svg.selectAll('.threePoint')
            .data(top10)
            .enter()
            .append('rect')
            .attr('class', 'threePoint')
            .attr('x', d => x(d.player))
            .attr('y', d => y(d.threePointPercentage))
            .attr('width', x.bandwidth())
            .attr('height', d => height - y(d.threePointPercentage))
            .attr('fill', 'rgba(231, 76, 60, 0.7)')
            .attr('stroke', 'rgba(231, 76, 60, 1)')
            .attr('stroke-width', 1);

        const freeThrowBars = svg.selectAll('.freeThrow')
            .data(top10)
            .enter()
            .append('rect')
            .attr('class', 'freeThrow')
            .attr('x', d => x(d.player))
            .attr('y', d => y(d.freeThrowPercentage))
            .attr('width', x.bandwidth())
            .attr('height', d => height - y(d.freeThrowPercentage))
            .attr('fill', 'rgba(46, 204, 113, 0.7)')
            .attr('stroke', 'rgba(46, 204, 113, 1)')
            .attr('stroke-width', 1);

        // Add legend
        const legend = svg.append('g')
            .attr('transform', `translate(${width - 100}, 0)`);

        legend.append('rect')
            .attr('x', 0)
            .attr('y', 0)
            .attr('width', 15)
            .attr('height', 15)
            .attr('fill', 'rgba(52, 152, 219, 0.7)')
            .attr('stroke', 'rgba(52, 152, 219, 1)');

        legend.append('text')
            .attr('x', 20)
            .attr('y', 12)
            .style('fill', '#ffffff')
            .text('2-Point %');

        legend.append('rect')
            .attr('x', 0)
            .attr('y', 20)
            .attr('width', 15)
            .attr('height', 15)
            .attr('fill', 'rgba(231, 76, 60, 0.7)')
            .attr('stroke', 'rgba(231, 76, 60, 1)');

        legend.append('text')
            .attr('x', 20)
            .attr('y', 32)
            .style('fill', '#ffffff')
            .text('3-Point %');

        legend.append('rect')
            .attr('x', 0)
            .attr('y', 40)
            .attr('width', 15)
            .attr('height', 15)
            .attr('fill', 'rgba(46, 204, 113, 0.7)')
            .attr('stroke', 'rgba(46, 204, 113, 1)');

        legend.append('text')
            .attr('x', 20)
            .attr('y', 52)
            .style('fill', '#ffffff')
            .text('Free Throw %');
    }

    updatePlayerComparison(selectedPlayer) {
        if (!selectedPlayer) return;

        const player = this.data.find(p => p.Player === selectedPlayer);
        if (!player) {
            console.error('Player data not found:', selectedPlayer);
            return;
        }

        // Update player comparison
        this.createPlayerComparison();
    }

    clearPlayerComparison() {
        // Clear player comparison
        d3.select('#playerComparison').selectAll('*').remove();
    }

    updateTeamComparison(selectedTeam) {
        if (!selectedTeam) return;

        // Update team comparison
        this.createTeamComparison();
    }

    clearTeamComparison() {
        // Clear team comparison
        d3.select('#teamComparison').selectAll('*').remove();
    }
} 