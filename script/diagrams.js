// Diagrams Visualization Script
class DiagramsVisualization {
    constructor() {
        this.data = [];
        this.init();
    }

    async init() {
        try {
            await this.loadData();
            this.createAllDiagrams();
            this.showContent();
        } catch (error) {
            console.error('Error initializing diagrams:', error);
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
        const numericFields = ['PTS', 'TRB', 'AST', 'STL', 'BLK', 'FG%', '3P%', 'FT%', 'MP', 'G', '2P%', 'TOV'];
        
        return data.map(d => {
            const cleaned = { ...d };
            numericFields.forEach(field => {
                const value = parseFloat(cleaned[field]);
                cleaned[field] = isNaN(value) ? 0 : value;
            });
            cleaned.Player = cleaned.Player || 'Unknown';
            cleaned.Tm = cleaned.Tm || 'N/A';
            return cleaned;
        }).filter(d => d.G > 0);
    }

    createAllDiagrams() {
        this.createScoringChart();
        this.createEfficiencyChart();
        this.createRadarChart();
        this.createMatrixChart();
    }

    createScoringChart() {
        const container = document.getElementById('scoringChart');
        const containerWidth = container.offsetWidth || 600;
        const margin = { top: 30, right: 40, bottom: 60, left: 140 };
        const width = containerWidth - margin.left - margin.right;
        const height = 400 - margin.top - margin.bottom;

        // Clear previous
        d3.select('#scoringChart').selectAll('*').remove();

        const svg = d3.select('#scoringChart')
            .append('svg')
            .attr('width', containerWidth)
            .attr('height', 400)
            .append('g')
            .attr('transform', `translate(${margin.left},${margin.top})`);

        // Get top 15 scorers with duplicate handling
        const playerStats = {};
        this.data.forEach(player => {
            const name = player.Player;
            if (!playerStats[name] || playerStats[name].PTS < player.PTS) {
                playerStats[name] = player;
            }
        });
        
        const uniquePlayers = Object.values(playerStats);
        const top15 = uniquePlayers
            .sort((a, b) => b.PTS - a.PTS)
            .slice(0, 15);

        // Scales
        const x = d3.scaleLinear()
            .domain([0, d3.max(top15, d => d.PTS) * 1.1])
            .range([0, width]);

        const y = d3.scaleBand()
            .domain(top15.map(d => d.Player))
            .range([0, height])
            .padding(0.1);

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

        // X axis label
        svg.append('text')
            .attr('x', width / 2)
            .attr('y', height + margin.bottom - 10)
            .attr('text-anchor', 'middle')
            .style('fill', '#2c3e50')
            .style('font-weight', 'bold')
            .text('Points per Game');

        // Bars
        const bars = svg.selectAll('.bar')
            .data(top15)
            .enter().append('g')
            .attr('class', 'bar-group');

        bars.append('rect')
            .attr('class', 'bar')
            .attr('x', 0)
            .attr('y', d => y(d.Player))
            .attr('width', 0)
            .attr('height', y.bandwidth())
            .attr('fill', '#00ff88')
            .transition()
            .duration(800)
            .delay((d, i) => i * 50)
            .attr('width', d => x(d.PTS));

        // Value labels
        bars.append('text')
            .attr('x', d => x(d.PTS) + 5)
            .attr('y', d => y(d.Player) + y.bandwidth() / 2)
            .attr('dy', '0.35em')
            .style('fill', '#ffffff')
            .style('font-size', '12px')
            .text(d => d.PTS.toFixed(1));

        // Title
        svg.append('text')
            .attr('x', width / 2)
            .attr('y', -20)
            .attr('text-anchor', 'middle')
            .style('fill', '#ffffff')
            .style('font-size', '16px')
            .style('font-weight', 'bold')
            .text('Top 15 Scorers (Points per Game)');
    }

    createEfficiencyChart() {
        const container = document.getElementById('efficiencyChart');
        const containerWidth = container.offsetWidth || 600;
        const margin = { top: 30, right: 80, bottom: 80, left: 50 };
        const width = containerWidth - margin.left - margin.right;
        const height = 400 - margin.top - margin.bottom;

        // Clear previous
        d3.select('#efficiencyChart').selectAll('*').remove();

        const svg = d3.select('#efficiencyChart')
            .append('svg')
            .attr('width', containerWidth)
            .attr('height', 400)
            .append('g')
            .attr('transform', `translate(${margin.left},${margin.top})`);

        // Filter players with significant attempts
        const efficiencyData = this.data
            .filter(d => d.FGA > 5)
            .sort((a, b) => b['FG%'] - a['FG%'])
            .slice(0, 20);

        // Prepare data for grouped bars
        const shootingTypes = ['2P%', '3P%', 'FT%'];
        const groupedData = efficiencyData.map(player => ({
            player: player.Player,
            values: shootingTypes.map(type => ({
                type: type,
                value: player[type] * 100
            }))
        }));

        // Scales
        const x0 = d3.scaleBand()
            .domain(groupedData.map(d => d.player))
            .range([0, width])
            .paddingInner(0.1);

        const x1 = d3.scaleBand()
            .domain(shootingTypes)
            .range([0, x0.bandwidth()])
            .padding(0.05);

        const y = d3.scaleLinear()
            .domain([0, 100])
            .range([height, 0]);

        const color = d3.scaleOrdinal()
            .domain(shootingTypes)
            .range(['#3498db', '#e74c3c', '#f39c12']);

        // X axis
        svg.append('g')
            .attr('transform', `translate(0,${height})`)
            .call(d3.axisBottom(x0))
            .selectAll('text')
            .attr('transform', 'rotate(-45)')
            .style('text-anchor', 'end')
            .style('fill', '#2c3e50')
            .style('font-size', '11px');

        // Y axis
        svg.append('g')
            .call(d3.axisLeft(y))
            .selectAll('text')
            .style('fill', '#2c3e50');

        // Y axis label
        svg.append('text')
            .attr('transform', 'rotate(-90)')
            .attr('y', 0 - margin.left)
            .attr('x', 0 - (height / 2))
            .attr('dy', '1em')
            .style('text-anchor', 'middle')
            .style('fill', '#2c3e50')
            .style('font-weight', 'bold')
            .text('Shooting Percentage');

        // Groups
        const playerGroups = svg.selectAll('.player-group')
            .data(groupedData)
            .enter().append('g')
            .attr('class', 'player-group')
            .attr('transform', d => `translate(${x0(d.player)},0)`);

        // Bars
        playerGroups.selectAll('rect')
            .data(d => d.values)
            .enter().append('rect')
            .attr('x', d => x1(d.type))
            .attr('y', height)
            .attr('width', x1.bandwidth())
            .attr('height', 0)
            .attr('fill', d => color(d.type))
            .transition()
            .duration(800)
            .attr('y', d => y(d.value))
            .attr('height', d => height - y(d.value));

        // Legend
        const legend = svg.selectAll('.legend')
            .data(shootingTypes)
            .enter().append('g')
            .attr('class', 'legend')
            .attr('transform', (d, i) => `translate(${width + 20},${i * 20})`);

        legend.append('rect')
            .attr('x', 0)
            .attr('width', 18)
            .attr('height', 18)
            .style('fill', color);

        legend.append('text')
            .attr('x', 24)
            .attr('y', 9)
            .attr('dy', '.35em')
            .style('text-anchor', 'start')
            .style('fill', '#2c3e50')
            .style('font-size', '12px')
            .text(d => d);
    }

    createRadarChart() {
        const container = document.getElementById('radarChart');
        const containerWidth = container.offsetWidth || 600;
        const width = containerWidth;
        const height = 400;
        const margin = 60;

        // Clear previous
        d3.select('#radarChart').selectAll('*').remove();

        const svg = d3.select('#radarChart')
            .append('svg')
            .attr('width', width)
            .attr('height', height);

        // Get top 5 players by impact
        const top5 = this.data
            .map(d => ({
                player: d.Player,
                stats: {
                    PTS: d.PTS,
                    AST: d.AST,
                    TRB: d.TRB,
                    STL: d.STL,
                    BLK: d.BLK
                },
                impact: d.PTS + d.AST + d.TRB + d.STL + d.BLK,
                visible: true
            }))
            .sort((a, b) => b.impact - a.impact)
            .slice(0, 5);

        const categories = ['PTS', 'AST', 'TRB', 'STL', 'BLK'];
        const centerX = width / 2;
        const centerY = height / 2;
        const radius = Math.min(width, height) / 2 - margin;

        // Find max values for scaling
        const maxValues = {};
        categories.forEach(cat => {
            maxValues[cat] = d3.max(top5, d => d.stats[cat]);
        });

        // Angle for each category
        const angleSlice = (Math.PI * 2) / categories.length;

        // Scale
        const rScale = d3.scaleLinear()
            .range([0, radius])
            .domain([0, 1]);

        // Draw circular grid
        const levels = 5;
        for (let level = 0; level <= levels; level++) {
            svg.append('circle')
                .attr('cx', centerX)
                .attr('cy', centerY)
                .attr('r', (radius / levels) * level)
                .style('fill', 'none')
                .style('stroke', '#ddd')
                .style('stroke-opacity', 0.5)
                .style('stroke-width', 1);
        }

        // Draw axes
        categories.forEach((cat, i) => {
            const angle = angleSlice * i - Math.PI / 2;
            const x = centerX + radius * Math.cos(angle);
            const y = centerY + radius * Math.sin(angle);

            svg.append('line')
                .attr('x1', centerX)
                .attr('y1', centerY)
                .attr('x2', x)
                .attr('y2', y)
                .style('stroke', '#ddd')
                .style('stroke-opacity', 0.5)
                .style('stroke-width', 1);

            // Labels
            const labelX = centerX + (radius + 20) * Math.cos(angle);
            const labelY = centerY + (radius + 20) * Math.sin(angle);

            svg.append('text')
                .attr('x', labelX)
                .attr('y', labelY)
                .attr('text-anchor', 'middle')
                .attr('dominant-baseline', 'middle')
                .style('fill', '#2c3e50')
                .style('font-size', '14px')
                .style('font-weight', 'bold')
                .text(cat);
        });

        // Colors for each player
        const colors = d3.scaleOrdinal(d3.schemeCategory10);

        // Create radar group for easier updates
        const radarGroup = svg.append('g').attr('class', 'radar-paths');

        // Function to update radar chart
        const updateRadar = () => {
            const paths = radarGroup.selectAll('.player-path')
                .data(top5.filter(d => d.visible), d => d.player);

            // Remove paths for hidden players
            paths.exit()
                .transition()
                .duration(300)
                .style('opacity', 0)
                .remove();

            // Add/update paths for visible players
            const pathsEnter = paths.enter()
                .append('g')
                .attr('class', 'player-path');

            pathsEnter.each(function(player, playerIndex) {
                const g = d3.select(this);
                const actualIndex = top5.findIndex(p => p.player === player.player);

                const dataPoints = categories.map((cat, i) => {
                    const value = player.stats[cat] / maxValues[cat];
                    const angle = angleSlice * i - Math.PI / 2;
                    return {
                        x: centerX + rScale(value) * Math.cos(angle),
                        y: centerY + rScale(value) * Math.sin(angle)
                    };
                });

                // Add first point at end to close the polygon
                dataPoints.push(dataPoints[0]);

                // Draw area
                const path = g.append('path')
                    .datum(dataPoints)
                    .attr('d', d3.line()
                        .x(d => d.x)
                        .y(d => d.y))
                    .style('fill', colors(actualIndex))
                    .style('fill-opacity', 0)
                    .style('stroke', colors(actualIndex))
                    .style('stroke-width', 2)
                    .style('opacity', 0);

                path.transition()
                    .duration(300)
                    .style('opacity', 1)
                    .style('fill-opacity', 0.3);

                // Draw points
                const circles = g.selectAll('circle')
                    .data(dataPoints.slice(0, -1))
                    .enter()
                    .append('circle')
                    .attr('cx', d => d.x)
                    .attr('cy', d => d.y)
                    .attr('r', 0)
                    .style('fill', colors(actualIndex));

                circles.transition()
                    .duration(300)
                    .attr('r', 4);
            });
        };

        // Initial draw
        updateRadar();

        // Interactive Legend
        const legend = svg.append('g')
            .attr('transform', `translate(20, 20)`);

        legend.append('rect')
            .attr('x', -5)
            .attr('y', -5)
            .attr('width', 150)
            .attr('height', 110)
            .attr('rx', 5)
            .style('fill', 'rgba(255, 255, 255, 0.9)')
            .style('stroke', '#ddd')
            .style('stroke-width', 1);

        top5.forEach((player, i) => {
            const legendRow = legend.append('g')
                .attr('transform', `translate(0, ${i * 20 + 5})`)
                .style('cursor', 'pointer');

            // Checkbox background
            const checkbox = legendRow.append('rect')
                .attr('x', 0)
                .attr('y', 0)
                .attr('width', 15)
                .attr('height', 15)
                .attr('rx', 3)
                .style('fill', colors(i))
                .style('stroke', '#ffffff')
                .style('stroke-width', 2);

            // Checkmark
            const checkmark = legendRow.append('path')
                .attr('d', 'M3,8 L6,11 L12,4')
                .style('fill', 'none')
                .style('stroke', '#ffffff')
                .style('stroke-width', 2)
                .style('stroke-linecap', 'round')
                .style('stroke-linejoin', 'round');

            // Player name
            const text = legendRow.append('text')
                .attr('x', 20)
                .attr('y', 12)
                .style('fill', '#2c3e50')
                .style('font-size', '12px')
                .text(player.player);

            // Click handler
            legendRow.on('click', function() {
                player.visible = !player.visible;
                
                // Update checkbox appearance
                checkbox.transition()
                    .duration(200)
                    .style('fill', player.visible ? colors(i) : 'rgba(255, 255, 255, 0.2)');
                
                checkmark.transition()
                    .duration(200)
                    .style('opacity', player.visible ? 1 : 0);
                
                text.transition()
                    .duration(200)
                    .style('opacity', player.visible ? 1 : 0.5);
                
                // Update radar chart
                updateRadar();
            });

            // Hover effect
            legendRow.on('mouseover', function() {
                d3.select(this).select('rect')
                    .style('stroke-width', 3);
            }).on('mouseout', function() {
                d3.select(this).select('rect')
                    .style('stroke-width', 2);
            });
        });
    }

    createMatrixChart() {
        const container = document.getElementById('matrixChart');
        const containerWidth = container.offsetWidth || 600;
        const margin = { top: 40, right: 20, bottom: 20, left: 130 };
        const width = Math.min(containerWidth - margin.left - margin.right, 400);
        const height = 400 - margin.top - margin.bottom;

        // Clear previous
        d3.select('#matrixChart').selectAll('*').remove();

        const svg = d3.select('#matrixChart')
            .append('svg')
            .attr('width', containerWidth)
            .attr('height', 400)
            .append('g')
            .attr('transform', `translate(${margin.left},${margin.top})`);

        // Get top 10 players
        const top10 = this.data
            .sort((a, b) => (b.PTS + b.AST + b.TRB) - (a.PTS + a.AST + a.TRB))
            .slice(0, 10);

        const stats = ['PTS', 'AST', 'TRB', 'STL', 'BLK'];

        // Scales
        const x = d3.scaleBand()
            .domain(stats)
            .range([0, width])
            .padding(0.01);

        const y = d3.scaleBand()
            .domain(top10.map(d => d.Player))
            .range([0, height])
            .padding(0.01);

        // Color scale
        const colorScale = d3.scaleSequential(d3.interpolateRdYlBu)
            .domain([1, 0]);

        // Create matrix
        const matrix = [];
        top10.forEach(player => {
            stats.forEach(stat => {
                const maxVal = d3.max(this.data, d => d[stat]);
                matrix.push({
                    player: player.Player,
                    stat: stat,
                    value: player[stat],
                    normalized: player[stat] / maxVal
                });
            });
        });

        // Tooltip
        const tooltip = d3.select('body').append('div')
            .attr('class', 'tooltip')
            .style('opacity', 0)
            .style('position', 'absolute')
            .style('background-color', 'rgba(0, 0, 0, 0.9)')
            .style('color', 'white')
            .style('padding', '10px')
            .style('border-radius', '5px')
            .style('pointer-events', 'none');

        // Draw tiles
        svg.selectAll('.matrix-tile')
            .data(matrix)
            .enter()
            .append('rect')
            .attr('class', 'matrix-tile')
            .attr('x', d => x(d.stat))
            .attr('y', d => y(d.player))
            .attr('width', x.bandwidth())
            .attr('height', y.bandwidth())
            .style('fill', d => colorScale(d.normalized))
            .style('opacity', 0)
            .style('cursor', 'pointer')
            .on('mouseover', function(event, d) {
                d3.select(this)
                    .style('stroke', '#000')
                    .style('stroke-width', 2);
                
                tooltip.transition()
                    .duration(200)
                    .style('opacity', .9);
                tooltip.html(`${d.player}<br/>${d.stat}: ${d.value.toFixed(1)}`)
                    .style('left', (event.pageX + 10) + 'px')
                    .style('top', (event.pageY - 28) + 'px');
            })
            .on('mouseout', function() {
                d3.select(this)
                    .style('stroke', 'none');
                
                tooltip.transition()
                    .duration(500)
                    .style('opacity', 0);
            })
            .transition()
            .duration(800)
            .style('opacity', 1);

        // Add text values
        svg.selectAll('.matrix-text')
            .data(matrix)
            .enter()
            .append('text')
            .attr('class', 'matrix-text')
            .attr('x', d => x(d.stat) + x.bandwidth() / 2)
            .attr('y', d => y(d.player) + y.bandwidth() / 2)
            .attr('text-anchor', 'middle')
            .attr('dominant-baseline', 'middle')
            .style('fill', d => d.normalized > 0.5 ? '#ffffff' : '#000000')
            .style('font-size', '10px')
            .style('pointer-events', 'none')
            .text(d => d.value.toFixed(1));

        // X axis
        svg.append('g')
            .attr('transform', `translate(0,${-5})`)
            .call(d3.axisTop(x))
            .selectAll('text')
            .style('fill', '#2c3e50')
            .style('font-size', '14px')
            .style('font-weight', 'bold');

        // Y axis
        svg.append('g')
            .attr('transform', `translate(${-5},0)`)
            .call(d3.axisLeft(y))
            .selectAll('text')
            .style('fill', '#2c3e50')
            .style('font-size', '11px')
            .attr('dx', '-0.5em');

        // Title
        svg.append('text')
            .attr('x', width / 2)
            .attr('y', -30)
            .attr('text-anchor', 'middle')
            .style('fill', '#2c3e50')
            .style('font-size', '16px')
            .style('font-weight', 'bold')
            .text('Player Performance Matrix');

        // Remove axis lines
        svg.selectAll('.domain').remove();
        svg.selectAll('.tick line').remove();
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
    new DiagramsVisualization();
});