// Import utilities
import { DataLoader } from '../utils/data-loader.js';
import { UIUtils } from '../utils/ui-utils.js';

export class NBACourtVisualizer {
    constructor(data) {
        this.data = data;
        this.init();
    }

    init() {
        this.createCourtVisualization();
        this.setupEventListeners();
    }

    createCourtVisualization() {
        const width = document.getElementById('court').offsetWidth;
        const height = 600;
        const margin = 50;

        // Clear previous visualization
        d3.select('#court').selectAll('*').remove();

        const svg = d3.select('#court')
            .append('svg')
            .attr('width', width)
            .attr('height', height);

        // Court outline
        svg.append('rect')
            .attr('x', margin)
            .attr('y', margin)
            .attr('width', width - 2 * margin)
            .attr('height', height - 2 * margin)
            .attr('fill', 'none')
            .attr('stroke', '#ffffff')
            .attr('stroke-width', 2);

        // Center circle
        svg.append('circle')
            .attr('cx', width / 2)
            .attr('cy', height / 2)
            .attr('r', 30)
            .attr('fill', 'none')
            .attr('stroke', '#ffffff')
            .attr('stroke-width', 2);

        // Three-point line
        svg.append('path')
            .attr('d', `M ${margin} ${height/2} 
                       A ${width/2 - margin} ${width/2 - margin} 0 0 1 ${width - margin} ${height/2}`)
            .attr('fill', 'none')
            .attr('stroke', '#ffffff')
            .attr('stroke-width', 2);

        // Free throw line
        svg.append('line')
            .attr('x1', width/2 - 100)
            .attr('y1', margin + 100)
            .attr('x2', width/2 + 100)
            .attr('y2', margin + 100)
            .attr('stroke', '#ffffff')
            .attr('stroke-width', 2);

        // Paint
        svg.append('rect')
            .attr('x', width/2 - 100)
            .attr('y', margin)
            .attr('width', 200)
            .attr('height', 100)
            .attr('fill', 'none')
            .attr('stroke', '#ffffff')
            .attr('stroke-width', 2);
    }

    setupEventListeners() {
        const playerSelect = document.getElementById('playerSelect');
        const shotTypeSelect = document.getElementById('shotTypeSelect');

        if (playerSelect) {
            playerSelect.addEventListener('change', () => {
                const selectedPlayer = playerSelect.value;
                if (selectedPlayer) {
                    this.updateShotData(selectedPlayer);
                } else {
                    this.clearShotData();
                }
            });
        }

        if (shotTypeSelect) {
            shotTypeSelect.addEventListener('change', () => {
                const selectedPlayer = playerSelect?.value;
                if (selectedPlayer) {
                    this.updateShotData(selectedPlayer);
                }
            });
        }
    }

    updateShotData(selectedPlayer) {
        if (!selectedPlayer) {
            this.clearShotData();
            return;
        }

        const player = this.data.find(p => p.Player === selectedPlayer);
        if (!player) {
            console.error('Player data not found:', selectedPlayer);
            return;
        }

        this.updateShotLocations(selectedPlayer);
        this.updateShotStatistics(player);
    }

    clearShotData() {
        d3.select('#court svg').selectAll('.shot').remove();
        this.updateShotStatistics(null);
    }

    updateShotLocations(selectedPlayer) {
        const player = this.data.find(p => p.Player === selectedPlayer);
        if (!player) return;

        const width = document.getElementById('court').offsetWidth;
        const height = 600;
        const margin = 50;

        // Clear previous shot locations
        d3.select('#court svg').selectAll('.shot').remove();

        // Generate random shot locations based on player's shooting percentages
        const numShots = 50;
        const shots = [];

        for (let i = 0; i < numShots; i++) {
            const isThree = Math.random() < (player['3PA'] / player.FGA);
            const isMade = Math.random() < (isThree ? player['3P%'] : player['2P%']);

            // Generate random coordinates within the court
            const x = margin + Math.random() * (width - 2 * margin);
            const y = margin + Math.random() * (height - 2 * margin);

            shots.push({
                x,
                y,
                isThree,
                isMade
            });
        }

        // Add shot locations
        d3.select('#court svg')
            .selectAll('.shot')
            .data(shots)
            .enter()
            .append('circle')
            .attr('class', 'shot')
            .attr('cx', d => d.x)
            .attr('cy', d => d.y)
            .attr('r', 4)
            .attr('fill', d => d.isMade ? 'rgba(52, 152, 219, 0.7)' : 'rgba(231, 76, 60, 0.7)')
            .attr('stroke', d => d.isMade ? 'rgba(52, 152, 219, 1)' : 'rgba(231, 76, 60, 1)')
            .attr('stroke-width', 1);

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

        d3.select('#court svg')
            .selectAll('.shot')
            .on('mouseover', function(event, d) {
                tooltip.transition()
                    .duration(200)
                    .style('opacity', .9);
                tooltip.html(`${d.isThree ? '3-Pointer' : '2-Pointer'}<br/>${d.isMade ? 'Made' : 'Missed'}`)
                    .style('left', (event.pageX + 10) + 'px')
                    .style('top', (event.pageY - 28) + 'px');
            })
            .on('mouseout', function() {
                tooltip.transition()
                    .duration(500)
                    .style('opacity', 0);
            });
    }

    updateShotStatistics(player) {
        const shotDistribution = document.getElementById('shotDistribution');
        const fgPercentage = document.getElementById('fgPercentage');
        const pointsPerShot = document.getElementById('pointsPerShot');

        if (!player) {
            if (shotDistribution) shotDistribution.textContent = '0.0% Field Goal';
            if (fgPercentage) fgPercentage.textContent = '0.0% Three Point';
            if (pointsPerShot) pointsPerShot.textContent = '0.00 Points per Shot';
            return;
        }

        if (shotDistribution) {
            shotDistribution.textContent = `${(player['FG%'] * 100).toFixed(1)}% Field Goal`;
        }
        if (fgPercentage) {
            fgPercentage.textContent = `${(player['3P%'] * 100).toFixed(1)}% Three Point`;
        }
        if (pointsPerShot) {
            const pps = player.FGA > 0 ? (player.PTS / player.FGA) : 0;
            pointsPerShot.textContent = `${pps.toFixed(2)} Points per Shot`;
        }
    }
}

// Initialize the court visualizer when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    // Load data and initialize
    d3.dsv(';', 'data/regular.csv').then(data => {
        new NBACourtVisualizer(data);
    }).catch(error => {
        console.error('Error loading data:', error);
    });
}); 