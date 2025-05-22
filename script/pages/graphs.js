export class GraphsPage {
    constructor(data) {
        this.data = data;
        this.init();
    }

    init() {
        this.createTrendGraph();
        this.createTeamGraph();
        this.createDistributionGraph();
        this.createImpactGraph();
        this.setupEventListeners();
    }

    setupEventListeners() {
        const playerSelect = document.getElementById('playerSelect');
        if (playerSelect) {
            playerSelect.addEventListener('change', () => {
                const selectedPlayer = playerSelect.value;
                if (selectedPlayer) {
                    this.updatePlayerVisualizations(selectedPlayer);
                } else {
                    this.clearPlayerVisualizations();
                }
            });
        }

        const teamSelect = document.getElementById('teamSelect');
        if (teamSelect) {
            teamSelect.addEventListener('change', () => {
                const selectedTeam = teamSelect.value;
                if (selectedTeam) {
                    this.updateTeamVisualizations(selectedTeam);
                } else {
                    this.clearTeamVisualizations();
                }
            });
        }
    }

    createTrendGraph(selectedPlayer = null) {
        if (!this.data || !this.data.length) {
            console.error('No data available for trend graph');
            return;
        }

        const margin = { top: 40, right: 100, bottom: 40, left: 60 };
        const container = document.getElementById('trendGraph');
        if (!container) {
            console.error('Trend graph container not found');
            return;
        }

        const width = container.offsetWidth - margin.left - margin.right;
        const height = 400 - margin.top - margin.bottom;

        // Clear previous graph
        d3.select('#trendGraph').selectAll('*').remove();

        const svg = d3.select('#trendGraph')
            .append('svg')
            .attr('width', width + margin.left + margin.right)
            .attr('height', height + margin.top + margin.bottom)
            .append('g')
            .attr('transform', `translate(${margin.left},${margin.top})`);

        const gameRanges = ['Games 1-10', 'Games 11-20', 'Games 21-30', 'Games 31-40', 'Games 41-50'];
        const x = d3.scalePoint()
            .range([0, width])
            .domain(gameRanges);

        const y = d3.scaleLinear()
            .range([height, 0])
            .domain([0, 40]);

        // Add X axis
        svg.append('g')
            .attr('transform', `translate(0,${height})`)
            .call(d3.axisBottom(x))
            .selectAll('text')
            .style('fill', '#ffffff');

        // Add Y axis
        svg.append('g')
            .call(d3.axisLeft(y))
            .selectAll('text')
            .style('fill', '#ffffff');

        if (selectedPlayer) {
            const player = this.data.find(p => p.Player === selectedPlayer);
            if (player) {
                // Add player data line
                const line = d3.line()
                    .x((d, i) => x(gameRanges[i]))
                    .y(d => y(d));

                const playerData = [
                    player.PTS * 0.8,
                    player.PTS * 0.9,
                    player.PTS,
                    player.PTS * 1.1,
                    player.PTS * 1.2
                ];

                svg.append('path')
                    .datum(playerData)
                    .attr('fill', 'none')
                    .attr('stroke', '#3498db')
                    .attr('stroke-width', 2)
                    .attr('d', line);

                // Add player name
                svg.append('text')
                    .attr('x', width - 100)
                    .attr('y', -10)
                    .style('fill', '#3498db')
                    .text(selectedPlayer);
            }
        }
    }

    createTeamGraph(selectedTeam = null) {
        if (!this.data || !this.data.length) {
            console.error('No data available for team graph');
            return;
        }

        const margin = { top: 40, right: 100, bottom: 40, left: 60 };
        const container = document.getElementById('teamGraph');
        if (!container) {
            console.error('Team graph container not found');
            return;
        }

        const width = container.offsetWidth - margin.left - margin.right;
        const height = 400 - margin.top - margin.bottom;

        // Clear previous graph
        d3.select('#teamGraph').selectAll('*').remove();

        const svg = d3.select('#teamGraph')
            .append('svg')
            .attr('width', width + margin.left + margin.right)
            .attr('height', height + margin.top + margin.bottom)
            .append('g')
            .attr('transform', `translate(${margin.left},${margin.top})`);

        // Calculate team averages
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

        const teamAverages = Object.entries(teams).map(([team, stats]) => ({
            team,
            points: d3.mean(stats.points),
            assists: d3.mean(stats.assists),
            rebounds: d3.mean(stats.rebounds)
        }));

        // Sort teams by points
        teamAverages.sort((a, b) => b.points - a.points);

        const x = d3.scaleBand()
            .range([0, width])
            .domain(teamAverages.map(d => d.team))
            .padding(0.1);

        const y = d3.scaleLinear()
            .range([height, 0])
            .domain([0, d3.max(teamAverages, d => d.points) * 1.1]);

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
            .data(teamAverages)
            .enter()
            .append('rect')
            .attr('class', 'bar')
            .attr('x', d => x(d.team))
            .attr('y', d => y(d.points))
            .attr('width', x.bandwidth())
            .attr('height', d => height - y(d.points))
            .attr('fill', (d, i) => i < 10 ? 'rgba(52, 152, 219, 0.7)' : 'rgba(231, 76, 60, 0.7)')
            .attr('stroke', (d, i) => i < 10 ? 'rgba(52, 152, 219, 1)' : 'rgba(231, 76, 60, 1)')
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
            .text('Top 10 Teams');

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
            .text('Bottom 10 Teams');
    }

    createDistributionGraph() {
        if (!this.data || !this.data.length) {
            console.error('No data available for distribution graph');
            return;
        }

        const margin = { top: 40, right: 100, bottom: 40, left: 60 };
        const container = document.getElementById('distributionGraph');
        if (!container) {
            console.error('Distribution graph container not found');
            return;
        }

        const width = container.offsetWidth - margin.left - margin.right;
        const height = 400 - margin.top - margin.bottom;

        // Clear previous graph
        d3.select('#distributionGraph').selectAll('*').remove();

        const svg = d3.select('#distributionGraph')
            .append('svg')
            .attr('width', width + margin.left + margin.right)
            .attr('height', height + margin.top + margin.bottom)
            .append('g')
            .attr('transform', `translate(${margin.left},${margin.top})`);

        // Calculate shooting distribution
        const shootingData = this.data.map(player => ({
            player: player.Player,
            twoPoint: player['2PA'],
            threePoint: player['3PA']
        }));

        // Sort by total attempts
        shootingData.sort((a, b) => (b.twoPoint + b.threePoint) - (a.twoPoint + a.threePoint));

        // Take top 10 players
        const top10 = shootingData.slice(0, 10);

        const x = d3.scaleBand()
            .range([0, width])
            .domain(top10.map(d => d.player))
            .padding(0.1);

        const y = d3.scaleLinear()
            .range([height, 0])
            .domain([0, d3.max(top10, d => d.twoPoint + d.threePoint) * 1.1]);

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
            .attr('y', d => y(d.twoPoint))
            .attr('width', x.bandwidth())
            .attr('height', d => height - y(d.twoPoint))
            .attr('fill', 'rgba(52, 152, 219, 0.7)')
            .attr('stroke', 'rgba(52, 152, 219, 1)')
            .attr('stroke-width', 1);

        const threePointBars = svg.selectAll('.threePoint')
            .data(top10)
            .enter()
            .append('rect')
            .attr('class', 'threePoint')
            .attr('x', d => x(d.player))
            .attr('y', d => y(d.threePoint))
            .attr('width', x.bandwidth())
            .attr('height', d => height - y(d.threePoint))
            .attr('fill', 'rgba(231, 76, 60, 0.7)')
            .attr('stroke', 'rgba(231, 76, 60, 1)')
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
            .text('2-Point Shots');

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
            .text('3-Point Shots');
    }

    createImpactGraph() {
        if (!this.data || !this.data.length) {
            console.error('No data available for impact graph');
            return;
        }

        const margin = { top: 40, right: 100, bottom: 40, left: 60 };
        const container = document.getElementById('impactGraph');
        if (!container) {
            console.error('Impact graph container not found');
            return;
        }

        const width = container.offsetWidth - margin.left - margin.right;
        const height = 400 - margin.top - margin.bottom;

        // Clear previous graph
        d3.select('#impactGraph').selectAll('*').remove();

        const svg = d3.select('#impactGraph')
            .append('svg')
            .attr('width', width + margin.left + margin.right)
            .attr('height', height + margin.top + margin.bottom)
            .append('g')
            .attr('transform', `translate(${margin.left},${margin.top})`);

        // Calculate player impact (points + assists + rebounds)
        const impactData = this.data.map(player => ({
            player: player.Player,
            impact: player.PTS + player.AST + player.TRB
        }));

        // Sort by impact
        impactData.sort((a, b) => b.impact - a.impact);

        // Take top 10 players
        const top10 = impactData.slice(0, 10);

        const x = d3.scaleBand()
            .range([0, width])
            .domain(top10.map(d => d.player))
            .padding(0.1);

        const y = d3.scaleLinear()
            .range([height, 0])
            .domain([0, d3.max(top10, d => d.impact) * 1.1]);

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
            .attr('y', d => y(d.impact))
            .attr('width', x.bandwidth())
            .attr('height', d => height - y(d.impact))
            .attr('fill', 'rgba(52, 152, 219, 0.7)')
            .attr('stroke', 'rgba(52, 152, 219, 1)')
            .attr('stroke-width', 1);
    }

    updatePlayerVisualizations(selectedPlayer) {
        if (!selectedPlayer) return;

        const player = this.data.find(p => p.Player === selectedPlayer);
        if (!player) {
            console.error('Player data not found:', selectedPlayer);
            return;
        }

        // Update trend graph
        this.createTrendGraph(selectedPlayer);
    }

    clearPlayerVisualizations() {
        // Clear trend graph
        d3.select('#trendGraph').selectAll('*').remove();
    }

    updateTeamVisualizations(selectedTeam) {
        if (!selectedTeam) return;

        // Update team graph
        this.createTeamGraph(selectedTeam);
    }

    clearTeamVisualizations() {
        // Clear team graph
        d3.select('#teamGraph').selectAll('*').remove();
    }
} 