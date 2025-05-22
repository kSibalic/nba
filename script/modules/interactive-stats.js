// Import utilities
import { DataLoader } from '../utils/data-loader.js';
import { UIUtils } from '../utils/ui-utils.js';

export class NBAInteractiveStats {
    constructor(data) {
        this.data = data;
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.createTrendGraph();
        this.createTeamGraph();
        this.createDistributionGraph();
        this.createImpactGraph();
    }

    setupEventListeners() {
        const playerSelect = document.getElementById('playerSelect');
        const teamSelect = document.getElementById('teamSelect');

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

    updatePlayerVisualizations(selectedPlayer) {
        if (!selectedPlayer) return;

        const player = this.data.find(p => p.Player === selectedPlayer);
        if (!player) {
            console.error('Player data not found:', selectedPlayer);
            return;
        }

        this.createTrendGraph(selectedPlayer);
        this.createImpactGraph(selectedPlayer);
    }

    clearPlayerVisualizations() {
        d3.select('#trendGraph').selectAll('*').remove();
        d3.select('#impactGraph').selectAll('*').remove();
    }

    updateTeamVisualizations(selectedTeam) {
        if (!selectedTeam) return;
        this.createTeamGraph(selectedTeam);
    }

    clearTeamVisualizations() {
        d3.select('#teamGraph').selectAll('*').remove();
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

        // Add Y axis label
        svg.append('text')
            .attr('transform', 'rotate(-90)')
            .attr('y', -margin.left + 15)
            .attr('x', -(height / 2))
            .attr('text-anchor', 'middle')
            .style('fill', '#ffffff')
            .text('Points per Game');

        // Add title
        svg.append('text')
            .attr('x', width / 2)
            .attr('y', -margin.top / 2)
            .attr('text-anchor', 'middle')
            .style('fill', '#ffffff')
            .style('font-size', '16px')
            .text('Player Performance Trends');

        if (selectedPlayer) {
            const player = this.data.find(p => p.Player === selectedPlayer);
            if (player && player.PTS !== undefined && !isNaN(player.PTS)) {
                // Generate trend data based on player's average points
                const basePoints = player.PTS;
                const data = [
                    basePoints * 0.9,  // Games 1-10
                    basePoints * 1.1,  // Games 11-20
                    basePoints * 0.95, // Games 21-30
                    basePoints * 1.05, // Games 31-40
                    basePoints        // Games 41-50
                ];

                const line = d3.line()
                    .x((d, i) => x(gameRanges[i]))
                    .y(d => y(d));

                // Add tooltip
                const tooltip = d3.select('body').append('div')
                    .attr('class', 'tooltip')
                    .style('opacity', 0)
                    .style('position', 'absolute')
                    .style('background-color', 'rgba(0, 0, 0, 0.8)')
                    .style('color', 'white')
                    .style('padding', '10px')
                    .style('border-radius', '5px')
                    .style('pointer-events', 'none');

                // Add the line
                svg.append('path')
                    .datum(data)
                    .attr('fill', 'none')
                    .attr('stroke', 'hsl(200, 70%, 50%)')
                    .attr('stroke-width', 2)
                    .attr('d', line);

                // Add dots
                svg.selectAll('circle')
                    .data(data)
                    .enter()
                    .append('circle')
                    .attr('cx', (d, i) => x(gameRanges[i]))
                    .attr('cy', d => y(d))
                    .attr('r', 4)
                    .attr('fill', 'hsl(200, 70%, 50%)')
                    .on('mouseover', function(event, d, i) {
                        tooltip.transition()
                            .duration(200)
                            .style('opacity', .9);
                        tooltip.html(`${gameRanges[i]}<br/>Points: ${d.toFixed(1)}`)
                            .style('left', (event.pageX + 10) + 'px')
                            .style('top', (event.pageY - 28) + 'px');
                    })
                    .on('mouseout', function() {
                        tooltip.transition()
                            .duration(500)
                            .style('opacity', 0);
                    });
            }
        }
    }

    createTeamGraph(selectedTeam = null) {
        if (!this.data || !this.data.length) {
            console.error('No data available for team graph');
            return;
        }

        const margin = { top: 40, right: 20, bottom: 60, left: 60 };
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
        const teamAverages = this.calculateTeamAverages();
        if (!teamAverages || Object.keys(teamAverages).length === 0) {
            console.error('No valid team data available');
            return;
        }

        // Sort teams by average points
        const sortedTeams = Object.entries(teamAverages)
            .sort((a, b) => b[1] - a[1]);

        // Get top and bottom teams
        const topTeams = sortedTeams.slice(0, 10);
        const bottomTeams = sortedTeams.slice(-10);

        // Determine which teams to display
        let teamsToDisplay;
        if (selectedTeam) {
            teamsToDisplay = [selectedTeam];
        } else {
            teamsToDisplay = [...topTeams.map(t => t[0]), ...bottomTeams.map(t => t[0])];
        }

        // Filter out any teams without valid data
        const validTeams = teamsToDisplay.filter(team => {
            const avg = teamAverages[team];
            return avg !== undefined && avg !== null && !isNaN(avg) && avg > 0;
        });

        if (validTeams.length === 0) {
            console.error('No valid team data available for display');
            return;
        }

        const x = d3.scaleBand()
            .range([0, width])
            .domain(validTeams)
            .padding(0.2);

        const y = d3.scaleLinear()
            .range([height, 0])
            .domain([0, d3.max(validTeams, team => teamAverages[team]) * 1.1]);

        // Add X axis
        svg.append('g')
            .attr('transform', `translate(0,${height})`)
            .call(d3.axisBottom(x))
            .selectAll('text')
            .attr('transform', 'translate(-10,0)rotate(-45)')
            .style('text-anchor', 'end')
            .style('fill', '#ffffff');

        // Add Y axis
        svg.append('g')
            .call(d3.axisLeft(y))
            .selectAll('text')
            .style('fill', '#ffffff');

        // Add Y axis label
        svg.append('text')
            .attr('transform', 'rotate(-90)')
            .attr('y', -margin.left + 15)
            .attr('x', -(height / 2))
            .attr('text-anchor', 'middle')
            .style('fill', '#ffffff')
            .text('Average Points per Game');

        // Add tooltip
        const tooltip = d3.select('body').append('div')
            .attr('class', 'tooltip')
            .style('opacity', 0)
            .style('position', 'absolute')
            .style('background-color', 'rgba(0, 0, 0, 0.8)')
            .style('color', 'white')
            .style('padding', '10px')
            .style('border-radius', '5px')
            .style('pointer-events', 'none');

        // Add bars
        svg.selectAll('rect')
            .data(validTeams)
            .enter()
            .append('rect')
            .attr('x', d => x(d))
            .attr('y', d => y(teamAverages[d]))
            .attr('width', x.bandwidth())
            .attr('height', d => height - y(teamAverages[d]))
            .attr('fill', (d, i) => {
                const isTopTeam = topTeams.some(t => t[0] === d);
                return isTopTeam ? 'rgba(52, 152, 219, 0.7)' : 'rgba(231, 76, 60, 0.7)';
            })
            .attr('stroke', (d, i) => {
                const isTopTeam = topTeams.some(t => t[0] === d);
                return isTopTeam ? 'rgba(52, 152, 219, 1)' : 'rgba(231, 76, 60, 1)';
            })
            .attr('stroke-width', 1)
            .on('mouseover', function(event, d) {
                tooltip.transition()
                    .duration(200)
                    .style('opacity', .9);
                tooltip.html(`${d}<br/>Average Points: ${teamAverages[d].toFixed(1)}`)
                    .style('left', (event.pageX + 10) + 'px')
                    .style('top', (event.pageY - 28) + 'px');
            })
            .on('mouseout', function() {
                tooltip.transition()
                    .duration(500)
                    .style('opacity', 0);
            });

        // Add title
        svg.append('text')
            .attr('x', width / 2)
            .attr('y', -margin.top / 2)
            .attr('text-anchor', 'middle')
            .style('fill', '#ffffff')
            .style('font-size', '16px')
            .text('Team Comparison');

        // Add legend
        const legend = svg.append('g')
            .attr('transform', `translate(${width - 100}, -20)`);

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

    calculateTeamAverages() {
        const teamAverages = {};
        const teamPlayers = {};

        // First pass: collect all valid data
        this.data.forEach(player => {
            if (!player.Tm || !player.PTS) return;
            
            if (!teamAverages[player.Tm]) {
                teamAverages[player.Tm] = 0;
                teamPlayers[player.Tm] = 0;
            }
            
            const points = parseFloat(player.PTS);
            if (!isNaN(points) && points > 0) {
                teamAverages[player.Tm] += points;
                teamPlayers[player.Tm]++;
            }
        });

        // Second pass: calculate averages
        const validTeams = {};
        Object.keys(teamAverages).forEach(team => {
            if (teamPlayers[team] > 0) {
                validTeams[team] = teamAverages[team] / teamPlayers[team];
            }
        });

        return validTeams;
    }

    createDistributionGraph() {
        if (!this.data || !this.data.length) {
            console.error('No data available for distribution graph');
            return;
        }

        const margin = { top: 40, right: 20, bottom: 60, left: 60 };
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

        const points = this.data.map(p => p.PTS);
        const x = d3.scaleLinear()
            .range([0, width])
            .domain([0, d3.max(points)]);

        const histogram = d3.histogram()
            .domain(x.domain())
            .thresholds(x.ticks(20));

        const bins = histogram(points);

        const y = d3.scaleLinear()
            .range([height, 0])
            .domain([0, d3.max(bins, d => d.length)]);

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

        // Add X axis label
        svg.append('text')
            .attr('x', width / 2)
            .attr('y', height + margin.bottom - 5)
            .attr('text-anchor', 'middle')
            .style('fill', '#ffffff')
            .text('Points per Game');

        // Add Y axis label
        svg.append('text')
            .attr('transform', 'rotate(-90)')
            .attr('y', -margin.left + 15)
            .attr('x', -(height / 2))
            .attr('text-anchor', 'middle')
            .style('fill', '#ffffff')
            .text('Number of Players');

        // Add tooltip
        const tooltip = d3.select('body').append('div')
            .attr('class', 'tooltip')
            .style('opacity', 0)
            .style('position', 'absolute')
            .style('background-color', 'rgba(0, 0, 0, 0.8)')
            .style('color', 'white')
            .style('padding', '10px')
            .style('border-radius', '5px')
            .style('pointer-events', 'none');

        // Add bars
        svg.selectAll('rect')
            .data(bins)
            .enter()
            .append('rect')
            .attr('x', d => x(d.x0))
            .attr('y', d => y(d.length))
            .attr('width', d => x(d.x1) - x(d.x0) - 1)
            .attr('height', d => height - y(d.length))
            .attr('fill', 'rgba(52, 152, 219, 0.7)')
            .attr('stroke', 'rgba(52, 152, 219, 1)')
            .attr('stroke-width', 1)
            .on('mouseover', function(event, d) {
                tooltip.transition()
                    .duration(200)
                    .style('opacity', .9);
                tooltip.html(`${d.x0.toFixed(1)}-${d.x1.toFixed(1)} PPG<br/>Players: ${d.length}`)
                    .style('left', (event.pageX + 10) + 'px')
                    .style('top', (event.pageY - 28) + 'px');
            })
            .on('mouseout', function() {
                tooltip.transition()
                    .duration(500)
                    .style('opacity', 0);
            });

        // Add title
        svg.append('text')
            .attr('x', width / 2)
            .attr('y', -margin.top / 2)
            .attr('text-anchor', 'middle')
            .style('fill', '#ffffff')
            .style('font-size', '16px')
            .text('Points Distribution');
    }

    createImpactGraph(selectedPlayer = null) {
        if (!this.data || !this.data.length) {
            console.error('No data available for impact graph');
            return;
        }

        const margin = { top: 40, right: 100, bottom: 60, left: 60 };
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

        const impactData = selectedPlayer ? 
            [this.data.find(p => p.Player === selectedPlayer)] :
            this.getImpactData(this.data);

        const x = d3.scaleLinear()
            .range([0, width])
            .domain([0, d3.max(impactData, d => d.points) * 1.1]);

        const y = d3.scaleLinear()
            .range([height, 0])
            .domain([0, d3.max(impactData, d => d.assists) * 1.1]);

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

        // Add X axis label
        svg.append('text')
            .attr('x', width / 2)
            .attr('y', height + margin.bottom - 5)
            .attr('text-anchor', 'middle')
            .style('fill', '#ffffff')
            .text('Points per Game');

        // Add Y axis label
        svg.append('text')
            .attr('transform', 'rotate(-90)')
            .attr('y', -margin.left + 15)
            .attr('x', -(height / 2))
            .attr('text-anchor', 'middle')
            .style('fill', '#ffffff')
            .text('Assists per Game');

        // Add tooltip
        const tooltip = d3.select('body').append('div')
            .attr('class', 'tooltip')
            .style('opacity', 0)
            .style('position', 'absolute')
            .style('background-color', 'rgba(0, 0, 0, 0.8)')
            .style('color', 'white')
            .style('padding', '10px')
            .style('border-radius', '5px')
            .style('pointer-events', 'none');

        // Add dots
        const dots = svg.selectAll('circle')
            .data(impactData)
            .enter()
            .append('circle')
            .attr('cx', d => x(d.points))
            .attr('cy', d => y(d.assists))
            .attr('r', 8)
            .attr('fill', (d, i) => `hsl(${(i * 360 / impactData.length)}, 70%, 50%)`)
            .attr('stroke', (d, i) => `hsl(${(i * 360 / impactData.length)}, 70%, 40%)`)
            .attr('stroke-width', 1)
            .on('mouseover', function(event, d) {
                tooltip.transition()
                    .duration(200)
                    .style('opacity', .9);
                tooltip.html(`${d.player}<br/>Points: ${d.points.toFixed(1)}<br/>Assists: ${d.assists.toFixed(1)}`)
                    .style('left', (event.pageX + 10) + 'px')
                    .style('top', (event.pageY - 28) + 'px');
            })
            .on('mouseout', function() {
                tooltip.transition()
                    .duration(500)
                    .style('opacity', 0);
            });

        // Add title
        svg.append('text')
            .attr('x', width / 2)
            .attr('y', -margin.top / 2)
            .attr('text-anchor', 'middle')
            .style('fill', '#ffffff')
            .style('font-size', '16px')
            .text('Player Impact Score');
    }

    getImpactData(data) {
        return data.map(player => ({
            player: player.Player,
            points: player.PTS,
            rebounds: player.TRB,
            assists: player.AST,
            steals: player.STL,
            blocks: player.BLK
        })).slice(0, 10);
    }
}

// Initialize the interactive stats when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    // Load data and initialize
    d3.dsv(';', 'data/regular.csv').then(data => {
        new NBAInteractiveStats(data);
    }).catch(error => {
        console.error('Error loading data:', error);
    });
}); 