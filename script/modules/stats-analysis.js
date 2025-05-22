// Import utilities
import { DataLoader } from '../utils/data-loader.js';
import { UIUtils } from '../utils/ui-utils.js';

export class NBAStatsAnalysis {
    constructor(data) {
        this.data = data;
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.createPlayerComparison();
        this.createTeamComparison();
        this.createTrendAnalysis();
    }

    setupEventListeners() {
        const playerSelect = document.getElementById('playerSelect');
        const teamSelect = document.getElementById('teamSelect');

        if (playerSelect) {
            playerSelect.addEventListener('change', () => {
                const selectedPlayer = playerSelect.value;
                if (selectedPlayer) {
                    this.updatePlayerAnalysis(selectedPlayer);
                } else {
                    this.clearPlayerAnalysis();
                }
            });
        }

        if (teamSelect) {
            teamSelect.addEventListener('change', () => {
                const selectedTeam = teamSelect.value;
                if (selectedTeam) {
                    this.updateTeamAnalysis(selectedTeam);
                } else {
                    this.clearTeamAnalysis();
                }
            });
        }
    }

    updatePlayerAnalysis(selectedPlayer) {
        if (!selectedPlayer) return;

        const player = this.data.find(p => p.Player === selectedPlayer);
        if (!player) {
            console.error('Player data not found:', selectedPlayer);
            return;
        }

        this.createPlayerComparison(selectedPlayer);
        this.createTrendAnalysis(selectedPlayer);
    }

    clearPlayerAnalysis() {
        d3.select('#playerComparison').selectAll('*').remove();
        d3.select('#trendAnalysis').selectAll('*').remove();
    }

    updateTeamAnalysis(selectedTeam) {
        if (!selectedTeam) return;
        this.createTeamComparison(selectedTeam);
    }

    clearTeamAnalysis() {
        d3.select('#teamComparison').selectAll('*').remove();
    }

    createPlayerComparison(selectedPlayer = null) {
        if (!this.data || !this.data.length) {
            console.error('No data available for player comparison');
            return;
        }

        const margin = { top: 40, right: 20, bottom: 60, left: 60 };
        const container = document.getElementById('playerComparison');
        if (!container) {
            console.error('Player comparison container not found');
            return;
        }

        const width = container.offsetWidth - margin.left - margin.right;
        const height = 400 - margin.top - margin.bottom;

        // Clear previous graph
        d3.select('#playerComparison').selectAll('*').remove();

        const svg = d3.select('#playerComparison')
            .append('svg')
            .attr('width', width + margin.left + margin.right)
            .attr('height', height + margin.top + margin.bottom)
            .append('g')
            .attr('transform', `translate(${margin.left},${margin.top})`);

        const stats = ['PTS', 'AST', 'TRB', 'STL', 'BLK'];
        const x = d3.scaleBand()
            .range([0, width])
            .domain(stats)
            .padding(0.2);

        const y = d3.scaleLinear()
            .range([height, 0])
            .domain([0, d3.max(this.data, d => Math.max(d.PTS, d.AST, d.TRB, d.STL, d.BLK)) * 1.1]);

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
            .text('Value');

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

        if (selectedPlayer) {
            const player = this.data.find(p => p.Player === selectedPlayer);
            if (player) {
                // Add bars for selected player
                svg.selectAll('rect')
                    .data(stats)
                    .enter()
                    .append('rect')
                    .attr('x', d => x(d))
                    .attr('y', d => y(player[d]))
                    .attr('width', x.bandwidth())
                    .attr('height', d => height - y(player[d]))
                    .attr('fill', 'rgba(52, 152, 219, 0.7)')
                    .attr('stroke', 'rgba(52, 152, 219, 1)')
                    .attr('stroke-width', 1)
                    .on('mouseover', function(event, d) {
                        tooltip.transition()
                            .duration(200)
                            .style('opacity', .9);
                        tooltip.html(`${d}: ${player[d].toFixed(1)}`)
                            .style('left', (event.pageX + 10) + 'px')
                            .style('top', (event.pageY - 28) + 'px');
                    })
                    .on('mouseout', function() {
                        tooltip.transition()
                            .duration(500)
                            .style('opacity', 0);
                    });
            }
        } else {
            // Add bars for league averages
            const leagueAverages = this.calculateLeagueAverages();
            svg.selectAll('rect')
                .data(stats)
                .enter()
                .append('rect')
                .attr('x', d => x(d))
                .attr('y', d => y(leagueAverages[d]))
                .attr('width', x.bandwidth())
                .attr('height', d => height - y(leagueAverages[d]))
                .attr('fill', 'rgba(231, 76, 60, 0.7)')
                .attr('stroke', 'rgba(231, 76, 60, 1)')
                .attr('stroke-width', 1)
                .on('mouseover', function(event, d) {
                    tooltip.transition()
                        .duration(200)
                        .style('opacity', .9);
                    tooltip.html(`League Average ${d}: ${leagueAverages[d].toFixed(1)}`)
                        .style('left', (event.pageX + 10) + 'px')
                        .style('top', (event.pageY - 28) + 'px');
                })
                .on('mouseout', function() {
                    tooltip.transition()
                        .duration(500)
                        .style('opacity', 0);
                });
        }

        // Add title
        svg.append('text')
            .attr('x', width / 2)
            .attr('y', -margin.top / 2)
            .attr('text-anchor', 'middle')
            .style('fill', '#ffffff')
            .style('font-size', '16px')
            .text(selectedPlayer ? `${selectedPlayer} Statistics` : 'League Average Statistics');
    }

    calculateLeagueAverages() {
        const stats = ['PTS', 'AST', 'TRB', 'STL', 'BLK'];
        const averages = {};

        stats.forEach(stat => {
            const sum = this.data.reduce((acc, player) => acc + parseFloat(player[stat] || 0), 0);
            averages[stat] = sum / this.data.length;
        });

        return averages;
    }

    createTeamComparison(selectedTeam = null) {
        if (!this.data || !this.data.length) {
            console.error('No data available for team comparison');
            return;
        }

        const margin = { top: 40, right: 20, bottom: 60, left: 60 };
        const container = document.getElementById('teamComparison');
        if (!container) {
            console.error('Team comparison container not found');
            return;
        }

        const width = container.offsetWidth - margin.left - margin.right;
        const height = 400 - margin.top - margin.bottom;

        // Clear previous graph
        d3.select('#teamComparison').selectAll('*').remove();

        const svg = d3.select('#teamComparison')
            .append('svg')
            .attr('width', width + margin.left + margin.right)
            .attr('height', height + margin.top + margin.bottom)
            .append('g')
            .attr('transform', `translate(${margin.left},${margin.top})`);

        const teamStats = this.calculateTeamStats();
        const teams = Object.keys(teamStats);

        const x = d3.scaleBand()
            .range([0, width])
            .domain(teams)
            .padding(0.2);

        const y = d3.scaleLinear()
            .range([height, 0])
            .domain([0, d3.max(teams, team => teamStats[team].points) * 1.1]);

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
            .data(teams)
            .enter()
            .append('rect')
            .attr('x', d => x(d))
            .attr('y', d => y(teamStats[d].points))
            .attr('width', x.bandwidth())
            .attr('height', d => height - y(teamStats[d].points))
            .attr('fill', d => d === selectedTeam ? 'rgba(52, 152, 219, 0.7)' : 'rgba(231, 76, 60, 0.7)')
            .attr('stroke', d => d === selectedTeam ? 'rgba(52, 152, 219, 1)' : 'rgba(231, 76, 60, 1)')
            .attr('stroke-width', 1)
            .on('mouseover', function(event, d) {
                tooltip.transition()
                    .duration(200)
                    .style('opacity', .9);
                tooltip.html(`${d}<br/>Points: ${teamStats[d].points.toFixed(1)}<br/>Players: ${teamStats[d].players}`)
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
    }

    calculateTeamStats() {
        const teamStats = {};

        this.data.forEach(player => {
            if (!player.Tm) return;

            if (!teamStats[player.Tm]) {
                teamStats[player.Tm] = {
                    points: 0,
                    players: 0
                };
            }

            const points = parseFloat(player.PTS);
            if (!isNaN(points) && points > 0) {
                teamStats[player.Tm].points += points;
                teamStats[player.Tm].players++;
            }
        });

        // Calculate averages
        Object.keys(teamStats).forEach(team => {
            if (teamStats[team].players > 0) {
                teamStats[team].points /= teamStats[team].players;
            }
        });

        return teamStats;
    }

    createTrendAnalysis(selectedPlayer = null) {
        if (!this.data || !this.data.length) {
            console.error('No data available for trend analysis');
            return;
        }

        const margin = { top: 40, right: 20, bottom: 60, left: 60 };
        const container = document.getElementById('trendAnalysis');
        if (!container) {
            console.error('Trend analysis container not found');
            return;
        }

        const width = container.offsetWidth - margin.left - margin.right;
        const height = 400 - margin.top - margin.bottom;

        // Clear previous graph
        d3.select('#trendAnalysis').selectAll('*').remove();

        const svg = d3.select('#trendAnalysis')
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

        // Add title
        svg.append('text')
            .attr('x', width / 2)
            .attr('y', -margin.top / 2)
            .attr('text-anchor', 'middle')
            .style('fill', '#ffffff')
            .style('font-size', '16px')
            .text(selectedPlayer ? `${selectedPlayer} Performance Trend` : 'Performance Trends');
    }
}

// Initialize the stats analysis when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    // Load data and initialize
    d3.dsv(';', 'data/regular.csv').then(data => {
        new NBAStatsAnalysis(data);
    }).catch(error => {
        console.error('Error loading data:', error);
    });
}); 