// Graphs Visualization Script
class GraphsVisualization {
    constructor() {
        this.data = [];
        this.selectedStat = 'PTS';
        this.init();
    }

    async init() {
        try {
            await this.loadData();
            this.setupEventListeners();
            this.createAllGraphs();
            this.showContent();
        } catch (error) {
            console.error('Error initializing graphs:', error);
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
        const numericFields = ['PTS', 'TRB', 'AST', 'STL', 'BLK', 'FG%', '3P%', 'FT%', 'MP', 'G'];
        
        return data.map(d => {
            const cleaned = { ...d };
            numericFields.forEach(field => {
                const value = parseFloat(cleaned[field]);
                cleaned[field] = isNaN(value) ? 0 : value;
            });
            cleaned.Player = cleaned.Player || 'Unknown';
            cleaned.Tm = cleaned.Tm || 'N/A';
            return cleaned;
        }).filter(d => d.G > 0); // Only include players who played games
    }

    setupEventListeners() {
        const statSelect = document.getElementById('statSelect');
        statSelect.addEventListener('change', (e) => {
            this.selectedStat = e.target.value;
            this.createTrendGraph();
        });
    }

    createAllGraphs() {
        this.createTrendGraph();
        this.createTeamGraph();
        this.createDistributionGraph();
        this.createImpactGraph();
    }

    createTrendGraph() {
        const container = document.getElementById('trendGraph');
        const containerWidth = container.offsetWidth || 600;
        
        // Responsive margins based on container width
        const isSmallScreen = containerWidth < 500;
        const margin = { 
            top: 20, 
            right: isSmallScreen ? 10 : 20, 
            bottom: isSmallScreen ? 60 : 70, 
            left: isSmallScreen ? 40 : 50 
        };
        
        const width = containerWidth - margin.left - margin.right;
        const height = 300 - margin.top - margin.bottom;

        // Clear previous
        d3.select('#trendGraph').selectAll('*').remove();

        const svg = d3.select('#trendGraph')
            .append('svg')
            .attr('width', containerWidth)
            .attr('height', 300)
            .append('g')
            .attr('transform', `translate(${margin.left},${margin.top})`);

        // Get top 10 players by selected stat
        // First, aggregate duplicate players by taking the max value
        const playerStats = {};
        this.data.forEach(player => {
            const name = player.Player;
            if (!playerStats[name] || playerStats[name][this.selectedStat] < player[this.selectedStat]) {
                playerStats[name] = player;
            }
        });
        
        // Convert back to array and sort
        const uniquePlayers = Object.values(playerStats);
        const top10 = uniquePlayers
            .sort((a, b) => b[this.selectedStat] - a[this.selectedStat])
            .slice(0, 10);

        // Scales
        const x = d3.scaleBand()
            .domain(top10.map(d => d.Player))
            .range([0, width])
            .padding(0.1);

        const y = d3.scaleLinear()
            .domain([0, d3.max(top10, d => d[this.selectedStat]) * 1.1])
            .range([height, 0]);

        // X axis with responsive font size
        const xAxisGroup = svg.append('g')
            .attr('transform', `translate(0,${height})`)
            .call(d3.axisBottom(x));
            
        xAxisGroup.selectAll('text')
            .attr('transform', 'rotate(-45)')
            .style('text-anchor', 'end')
            .style('fill', '#2c3e50')
            .style('font-size', isSmallScreen ? '9px' : '11px');

        // Y axis
        svg.append('g')
            .call(d3.axisLeft(y))
            .selectAll('text')
            .style('fill', '#2c3e50')
            .style('font-size', isSmallScreen ? '9px' : '11px');

        // Y axis label
        const statLabels = {
            'PTS': 'Points per Game',
            'TRB': 'Rebounds per Game',
            'AST': 'Assists per Game',
            'STL': 'Steals per Game',
            'BLK': 'Blocks per Game'
        };

        svg.append('text')
            .attr('transform', 'rotate(-90)')
            .attr('y', 0 - margin.left)
            .attr('x', 0 - (height / 2))
            .attr('dy', '1em')
            .style('text-anchor', 'middle')
            .style('fill', '#2c3e50')
            .style('font-weight', 'bold')
            .text(statLabels[this.selectedStat]);

        // Bars
        svg.selectAll('.bar')
            .data(top10)
            .enter().append('rect')
            .attr('class', 'bar')
            .attr('x', d => x(d.Player))
            .attr('y', height)
            .attr('width', x.bandwidth())
            .attr('height', 0)
            .attr('fill', '#00ff88')
            .transition()
            .duration(800)
            .attr('y', d => y(d[this.selectedStat]))
            .attr('height', d => height - y(d[this.selectedStat]));

        // Value labels with conditional display
        if (!isSmallScreen) {
            svg.selectAll('.value-label')
                .data(top10)
                .enter().append('text')
                .attr('class', 'value-label')
                .attr('x', d => x(d.Player) + x.bandwidth() / 2)
                .attr('y', d => y(d[this.selectedStat]) - 5)
                .attr('text-anchor', 'middle')
                .style('fill', '#2c3e50')
                .style('font-size', '10px')
                .style('font-weight', 'bold')
                .text(d => d[this.selectedStat].toFixed(1));
        }
    }

    createTeamGraph() {
        const container = document.getElementById('teamGraph');
        const containerWidth = container.offsetWidth || 600;
        
        // Responsive margins
        const isSmallScreen = containerWidth < 600;
        const margin = { 
            top: 20, 
            right: isSmallScreen ? 10 : 30, 
            bottom: isSmallScreen ? 80 : 100, 
            left: isSmallScreen ? 45 : 60 
        };
        
        const width = containerWidth - margin.left - margin.right;
        const height = 300 - margin.top - margin.bottom;

        // Clear previous
        d3.select('#teamGraph').selectAll('*').remove();

        const svg = d3.select('#teamGraph')
            .append('svg')
            .attr('width', containerWidth)
            .attr('height', 300)
            .append('g')
            .attr('transform', `translate(${margin.left},${margin.top})`);

        // Calculate team averages - limit number of teams for small screens
        const teamStats = d3.group(this.data, d => d.Tm);
        let teamAverages = Array.from(teamStats, ([team, players]) => ({
            team: team,
            avgPoints: d3.mean(players, d => d.PTS),
            playerCount: players.length
        })).sort((a, b) => b.avgPoints - a.avgPoints);
        
        // Limit teams on small screens
        if (isSmallScreen && teamAverages.length > 15) {
            teamAverages = teamAverages.slice(0, 15);
        }

        // Scales
        const x = d3.scaleBand()
            .domain(teamAverages.map(d => d.team))
            .range([0, width])
            .padding(0.1);

        const y = d3.scaleLinear()
            .domain([0, d3.max(teamAverages, d => d.avgPoints) * 1.1])
            .range([height, 0]);

        // Color scale
        const color = d3.scaleSequential(d3.interpolateRdYlGn)
            .domain([0, teamAverages.length - 1]);

        // X axis with smaller font on small screens
        const xAxisGroup = svg.append('g')
            .attr('transform', `translate(0,${height})`)
            .call(d3.axisBottom(x));
            
        xAxisGroup.selectAll('text')
            .attr('transform', 'rotate(-45)')
            .style('text-anchor', 'end')
            .style('fill', '#2c3e50')
            .style('font-size', isSmallScreen ? '8px' : '11px');

        // Y axis
        svg.append('g')
            .call(d3.axisLeft(y))
            .selectAll('text')
            .style('fill', '#2c3e50');

        // Y axis label
        svg.append('text')
            .attr('transform', 'rotate(-90)')
            .attr('y', 0 - margin.left + 15)
            .attr('x', 0 - (height / 2))
            .attr('dy', '1em')
            .style('text-anchor', 'middle')
            .style('fill', '#2c3e50')
            .style('font-weight', 'bold')
            .style('font-size', '13px')
            .text('Average Points per Game');

        // Bars
        svg.selectAll('.bar')
            .data(teamAverages)
            .enter().append('rect')
            .attr('class', 'bar')
            .attr('x', d => x(d.team))
            .attr('y', height)
            .attr('width', x.bandwidth())
            .attr('height', 0)
            .attr('fill', (d, i) => color(i))
            .transition()
            .duration(800)
            .delay((d, i) => i * 30)
            .attr('y', d => y(d.avgPoints))
            .attr('height', d => height - y(d.avgPoints));

        // Tooltip
        const tooltip = d3.select('body').append('div')
            .attr('class', 'tooltip')
            .style('opacity', 0)
            .style('position', 'absolute')
            .style('background-color', 'rgba(0, 0, 0, 0.8)')
            .style('color', 'white')
            .style('padding', '10px')
            .style('border-radius', '5px')
            .style('pointer-events', 'none');

        svg.selectAll('.bar')
            .on('mouseover', function(event, d) {
                tooltip.transition()
                    .duration(200)
                    .style('opacity', .9);
                tooltip.html(`${d.team}<br/>Avg Points: ${d.avgPoints.toFixed(1)}<br/>Players: ${d.playerCount}`)
                    .style('left', (event.pageX + 10) + 'px')
                    .style('top', (event.pageY - 28) + 'px');
            })
            .on('mouseout', function() {
                tooltip.transition()
                    .duration(500)
                    .style('opacity', 0);
            });
    }

    createDistributionGraph() {
        const container = document.getElementById('distributionGraph');
        const containerWidth = container.offsetWidth || 600;
        
        const isSmallScreen = containerWidth < 500;
        const margin = { 
            top: 20, 
            right: isSmallScreen ? 20 : 30, 
            bottom: isSmallScreen ? 45 : 60, 
            left: isSmallScreen ? 45 : 60 
        };
        
        const width = containerWidth - margin.left - margin.right;
        const height = 300 - margin.top - margin.bottom;

        // Clear previous
        d3.select('#distributionGraph').selectAll('*').remove();

        const svg = d3.select('#distributionGraph')
            .append('svg')
            .attr('width', containerWidth)
            .attr('height', 300)
            .append('g')
            .attr('transform', `translate(${margin.left},${margin.top})`);

        // Create histogram
        const points = this.data.map(d => d.PTS);
        
        const x = d3.scaleLinear()
            .domain([0, d3.max(points)])
            .range([0, width]);

        const histogram = d3.histogram()
            .domain(x.domain())
            .thresholds(x.ticks(20));

        const bins = histogram(points);

        const y = d3.scaleLinear()
            .domain([0, d3.max(bins, d => d.length)])
            .range([height, 0]);

        // X axis
        svg.append('g')
            .attr('transform', `translate(0,${height})`)
            .call(d3.axisBottom(x))
            .selectAll('text')
            .style('fill', '#2c3e50');

        // Y axis
        svg.append('g')
            .call(d3.axisLeft(y))
            .selectAll('text')
            .style('fill', '#2c3e50');

        // Axis labels
        svg.append('text')
            .attr('transform', `translate(${width/2}, ${height + margin.bottom - 10})`)
            .style('text-anchor', 'middle')
            .style('fill', '#2c3e50')
            .style('font-weight', 'bold')
            .style('font-size', '13px')
            .text('Points per Game');

        svg.append('text')
            .attr('transform', 'rotate(-90)')
            .attr('y', 0 - margin.left + 15)
            .attr('x', 0 - (height / 2))
            .attr('dy', '1em')
            .style('text-anchor', 'middle')
            .style('fill', '#2c3e50')
            .style('font-weight', 'bold')
            .style('font-size', '13px')
            .text('Number of Players');

        // Tooltip
        const tooltip = d3.select('body').append('div')
            .attr('class', 'tooltip')
            .style('opacity', 0)
            .style('position', 'absolute')
            .style('background-color', 'rgba(0, 0, 0, 0.8)')
            .style('color', 'white')
            .style('padding', '10px')
            .style('border-radius', '5px')
            .style('pointer-events', 'none');

        // Bars
        svg.selectAll('.bar')
            .data(bins)
            .enter().append('rect')
            .attr('class', 'bar')
            .attr('x', d => x(d.x0))
            .attr('y', height)
            .attr('width', d => x(d.x1) - x(d.x0) - 1)
            .attr('height', 0)
            .attr('fill', '#3498db')
            .on('mouseover', function(event, d) {
                d3.select(this)
                    .transition()
                    .duration(200)
                    .attr('fill', '#2980b9');
                
                tooltip.transition()
                    .duration(200)
                    .style('opacity', .9);
                tooltip.html(`Range: ${d.x0.toFixed(1)} - ${d.x1.toFixed(1)} PPG<br/>Players: ${d.length}`)
                    .style('left', (event.pageX + 10) + 'px')
                    .style('top', (event.pageY - 28) + 'px');
            })
            .on('mouseout', function(event, d) {
                d3.select(this)
                    .transition()
                    .duration(200)
                    .attr('fill', '#3498db');
                
                tooltip.transition()
                    .duration(500)
                    .style('opacity', 0);
            })
            .transition()
            .duration(800)
            .attr('y', d => y(d.length))
            .attr('height', d => height - y(d.length));
    }

    createImpactGraph() {
        const container = document.getElementById('impactGraph');
        const containerWidth = container.offsetWidth || 600;
        
        const isSmallScreen = containerWidth < 500;
        const margin = { 
            top: 20, 
            right: isSmallScreen ? 15 : 20, 
            bottom: isSmallScreen ? 45 : 50, 
            left: isSmallScreen ? 45 : 50 
        };
        
        const width = containerWidth - margin.left - margin.right;
        const height = 300 - margin.top - margin.bottom;

        // Clear previous
        d3.select('#impactGraph').selectAll('*').remove();

        const svg = d3.select('#impactGraph')
            .append('svg')
            .attr('width', containerWidth)
            .attr('height', 300)
            .append('g')
            .attr('transform', `translate(${margin.left},${margin.top})`);

        // Calculate impact score (PTS + AST + TRB)
        const impactData = this.data.map(d => ({
            player: d.Player,
            points: d.PTS,
            assists: d.AST,
            rebounds: d.TRB,
            impact: d.PTS + d.AST + d.TRB
        })).sort((a, b) => b.impact - a.impact).slice(0, 15);

        // Scales
        const x = d3.scaleLinear()
            .domain([0, d3.max(impactData, d => d.points) * 1.1])
            .range([0, width]);

        const y = d3.scaleLinear()
            .domain([0, d3.max(impactData, d => d.assists + d.rebounds) * 1.1])
            .range([height, 0]);

        const size = d3.scaleLinear()
            .domain([d3.min(impactData, d => d.impact), d3.max(impactData, d => d.impact)])
            .range([5, 20]);

        // X axis
        svg.append('g')
            .attr('transform', `translate(0,${height})`)
            .call(d3.axisBottom(x))
            .selectAll('text')
            .style('fill', '#2c3e50');

        // Y axis
        svg.append('g')
            .call(d3.axisLeft(y))
            .selectAll('text')
            .style('fill', '#2c3e50');

        // Axis labels
        svg.append('text')
            .attr('transform', `translate(${width/2}, ${height + margin.bottom})`)
            .style('text-anchor', 'middle')
            .style('fill', '#2c3e50')
            .style('font-weight', 'bold')
            .text('Points per Game');

        svg.append('text')
            .attr('transform', 'rotate(-90)')
            .attr('y', 0 - margin.left)
            .attr('x', 0 - (height / 2))
            .attr('dy', '1em')
            .style('text-anchor', 'middle')
            .style('fill', '#2c3e50')
            .style('font-weight', 'bold')
            .text('Assists + Rebounds per Game');

        // Tooltip
        const tooltip = d3.select('body').append('div')
            .attr('class', 'tooltip')
            .style('opacity', 0)
            .style('position', 'absolute')
            .style('background-color', 'rgba(0, 0, 0, 0.8)')
            .style('color', 'white')
            .style('padding', '10px')
            .style('border-radius', '5px')
            .style('pointer-events', 'none');

        // Bubbles
        svg.selectAll('.bubble')
            .data(impactData)
            .enter().append('circle')
            .attr('class', 'bubble')
            .attr('cx', d => x(d.points))
            .attr('cy', d => y(d.assists + d.rebounds))
            .attr('r', 0)
            .attr('fill', '#ff6b6b')
            .attr('fill-opacity', 0.7)
            .attr('stroke', '#ff6b6b')
            .attr('stroke-width', 2)
            .on('mouseover', function(event, d) {
                d3.select(this)
                    .transition()
                    .duration(200)
                    .attr('fill-opacity', 1);
                
                tooltip.transition()
                    .duration(200)
                    .style('opacity', .9);
                tooltip.html(`${d.player}<br/>Points: ${d.points.toFixed(1)}<br/>Assists: ${d.assists.toFixed(1)}<br/>Rebounds: ${d.rebounds.toFixed(1)}<br/>Impact: ${d.impact.toFixed(1)}`)
                    .style('left', (event.pageX + 10) + 'px')
                    .style('top', (event.pageY - 28) + 'px');
            })
            .on('mouseout', function() {
                d3.select(this)
                    .transition()
                    .duration(200)
                    .attr('fill-opacity', 0.7);
                
                tooltip.transition()
                    .duration(500)
                    .style('opacity', 0);
            })
            .transition()
            .duration(800)
            .delay((d, i) => i * 50)
            .attr('r', d => size(d.impact));
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
    new GraphsVisualization();
});