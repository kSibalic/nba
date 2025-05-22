export class CourtVisualization {
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

        d3.select('#court').selectAll('*').remove();

        const svg = d3.select('#court')
            .append('svg')
            .attr('width', width)
            .attr('height', height);

        this.drawCourtElements(svg, width, height, margin);
    }

    drawCourtElements(svg, width, height, margin) {
        svg.append('rect')
            .attr('x', margin)
            .attr('y', margin)
            .attr('width', width - 2 * margin)
            .attr('height', height - 2 * margin)
            .attr('fill', 'none')
            .attr('stroke', '#ffffff')
            .attr('stroke-width', 2);

        svg.append('circle')
            .attr('cx', width / 2)
            .attr('cy', height / 2)
            .attr('r', 30)
            .attr('fill', 'none')
            .attr('stroke', '#ffffff')
            .attr('stroke-width', 2);

        svg.append('path')
            .attr('d', `M ${margin} ${height/2} A ${width/2 - margin} ${width/2 - margin} 0 0 1 ${width - margin} ${height/2}`)
            .attr('fill', 'none')
            .attr('stroke', '#ffffff')
            .attr('stroke-width', 2);

        svg.append('line')
            .attr('x1', width/2 - 100)
            .attr('y1', margin + 100)
            .attr('x2', width/2 + 100)
            .attr('y2', margin + 100)
            .attr('stroke', '#ffffff')
            .attr('stroke-width', 2);

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
        if (playerSelect) {
            playerSelect.addEventListener('change', () => {
                const selectedPlayer = playerSelect.value;
                if (selectedPlayer) this.updateShotData(selectedPlayer);
                else this.clearShotData();
            });
        }
    }

    updateShotData(playerName) {
        const player = this.data.find(p => p.Player === playerName);
        if (!player) return;

        this.updateShotLocations(player);
        this.updateShotStatistics(player);
    }

    clearShotData() {
        d3.select('#court svg').selectAll('.shot').remove();
        this.updateShotStatistics(null);
    }

    updateShotLocations(player) {
        const width = document.getElementById('court').offsetWidth;
        const height = 600;
        const margin = 50;

        d3.select('#court svg').selectAll('.shot').remove();

        const numShots = 50;
        const shots = Array.from({ length: numShots }, () => {
            const isThree = Math.random() < (player['3PA'] / player.FGA);
            const isMade = Math.random() < (isThree ? player['3P%'] : player['2P%']);
            return {
                x: margin + Math.random() * (width - 2 * margin),
                y: margin + Math.random() * (height - 2 * margin),
                isThree,
                isMade
            };
        });

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
    }

    updateShotStatistics(player) {
        const stats = {
            shotDistribution: player ? `${(player['FG%'] * 100).toFixed(1)}% Field Goal` : '0.0% Field Goal',
            fgPercentage: player ? `${(player['3P%'] * 100).toFixed(1)}% Three Point` : '0.0% Three Point',
            pointsPerShot: player ? `${(player.FGA > 0 ? (player.PTS / player.FGA) : 0).toFixed(2)} Points per Shot` : '0.00 Points per Shot'
        };

        Object.entries(stats).forEach(([id, value]) => {
            const element = document.getElementById(id);
            if (element) element.textContent = value;
        });
    }
}
