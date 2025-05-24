// Court Visualization Script
class CourtVisualization {
    constructor() {
        this.data = [];
        this.selectedPlayer = null;
        this.init();
    }

    async init() {
        try {
            await this.loadData();
            this.populatePlayerSelect();
            this.createCourt();
            this.setupEventListeners();
            this.showContent();
        } catch (error) {
            console.error('Error initializing court visualization:', error);
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
        const numericFields = ['FG', 'FGA', 'FG%', '3P', '3PA', '3P%', '2P', '2PA', '2P%', 'FT', 'FTA', 'FT%', 'PTS'];
        
        return data.map(d => {
            const cleaned = { ...d };
            numericFields.forEach(field => {
                const value = parseFloat(cleaned[field]);
                cleaned[field] = isNaN(value) ? 0 : value;
            });
            cleaned.Player = cleaned.Player || 'Unknown';
            return cleaned;
        });
    }

    populatePlayerSelect() {
        const select = document.getElementById('playerSelect');
        const players = [...new Set(this.data.map(p => p.Player))].sort();
        
        players.forEach(player => {
            const option = document.createElement('option');
            option.value = player;
            option.textContent = player;
            select.appendChild(option);
        });
    }

    createCourt() {
        const container = document.getElementById('court');
        const width = container.offsetWidth || 800;
        const height = 500;
        const margin = { top: 20, right: 20, bottom: 20, left: 20 };

        // Clear previous
        d3.select('#court').selectAll('*').remove();

        const svg = d3.select('#court')
            .append('svg')
            .attr('width', width)
            .attr('height', height)
            .style('background-color', '#2a2a2a');

        const court = svg.append('g')
            .attr('transform', `translate(${margin.left}, ${margin.top})`);

        const courtWidth = width - margin.left - margin.right;
        const courtHeight = height - margin.top - margin.bottom;

        // Court dimensions (scaled)
        const basketX = courtWidth * 0.05;
        const basketY = courtHeight / 2;
        const threePointRadius = courtWidth * 0.35;
        const paintWidth = courtWidth * 0.16;
        const paintHeight = courtHeight * 0.35;
        const ftLineX = basketX + courtWidth * 0.19;
        const cornerThreeX = courtWidth * 0.14;

        // Court outline
        court.append('rect')
            .attr('x', 0)
            .attr('y', 0)
            .attr('width', courtWidth)
            .attr('height', courtHeight)
            .attr('fill', 'none')
            .attr('stroke', '#ffffff')
            .attr('stroke-width', 3);

        // Paint area
        court.append('rect')
            .attr('x', 0)
            .attr('y', (courtHeight - paintHeight) / 2)
            .attr('width', paintWidth)
            .attr('height', paintHeight)
            .attr('fill', 'none')
            .attr('stroke', '#ffffff')
            .attr('stroke-width', 2);

        // Free throw line
        court.append('line')
            .attr('x1', ftLineX)
            .attr('y1', (courtHeight - paintHeight) / 2)
            .attr('x2', ftLineX)
            .attr('y2', (courtHeight + paintHeight) / 2)
            .attr('stroke', '#ffffff')
            .attr('stroke-width', 2);

        // Free throw circle (full circle)
        court.append('circle')
            .attr('cx', ftLineX)
            .attr('cy', basketY)
            .attr('r', courtHeight * 0.12)
            .attr('fill', 'none')
            .attr('stroke', '#ffffff')
            .attr('stroke-width', 2);

        // Three-point line - main arc
        const arcPath = d3.path();
        const startAngle = -Math.asin((courtHeight * 0.9 - basketY) / threePointRadius);
        const endAngle = Math.asin((courtHeight * 0.9 - basketY) / threePointRadius);
        
        arcPath.arc(basketX, basketY, threePointRadius, startAngle, endAngle);
        
        court.append('path')
            .attr('d', arcPath.toString())
            .attr('fill', 'none')
            .attr('stroke', '#ffffff')
            .attr('stroke-width', 2);

        // Three-point corner lines (connecting arc to sideline)
        const arcTopY = basketY - threePointRadius * Math.sin(startAngle);
        const arcBottomY = basketY + threePointRadius * Math.sin(endAngle);
        
        // Top corner line
        court.append('line')
            .attr('x1', 0)
            .attr('y1', arcTopY)
            .attr('x2', cornerThreeX)
            .attr('y2', arcTopY)
            .attr('stroke', '#ffffff')
            .attr('stroke-width', 2);

        // Bottom corner line
        court.append('line')
            .attr('x1', 0)
            .attr('y1', arcBottomY)
            .attr('x2', cornerThreeX)
            .attr('y2', arcBottomY)
            .attr('stroke', '#ffffff')
            .attr('stroke-width', 2);

        // Basket
        court.append('circle')
            .attr('cx', basketX)
            .attr('cy', basketY)
            .attr('r', 8)
            .attr('fill', 'none')
            .attr('stroke', '#ff6b6b')
            .attr('stroke-width', 3);

        // Backboard
        court.append('line')
            .attr('x1', basketX - 5)
            .attr('y1', basketY - 30)
            .attr('x2', basketX - 5)
            .attr('y2', basketY + 30)
            .attr('stroke', '#ffffff')
            .attr('stroke-width', 3);

        this.court = court;
        this.courtWidth = courtWidth;
        this.courtHeight = courtHeight;
        this.basketX = basketX;
        this.basketY = basketY;
        this.threePointRadius = threePointRadius;
        this.ftLineX = ftLineX;
        this.paintWidth = paintWidth;
        this.paintHeight = paintHeight;
        this.cornerThreeX = cornerThreeX;
        this.arcTopY = arcTopY;
        this.arcBottomY = arcBottomY;
    }

    updateShots(player) {
        if (!this.court) return;

        // Remove existing shots
        this.court.selectAll('.shot').remove();

        const playerData = this.data.find(p => p.Player === player);
        if (!playerData) return;

        // Generate shots based on actual shooting data
        const shots = this.generateRealisticShots(playerData);

        // Create tooltip
        const tooltip = d3.select('body').append('div')
            .attr('class', 'tooltip')
            .style('opacity', 0)
            .style('position', 'absolute')
            .style('background-color', 'rgba(0, 0, 0, 0.8)')
            .style('color', 'white')
            .style('padding', '10px')
            .style('border-radius', '5px')
            .style('pointer-events', 'none');

        // Add shots with different styles for each type
        this.court.selectAll('.shot')
            .data(shots)
            .enter()
            .append('circle')
            .attr('class', 'shot')
            .attr('cx', d => d.x)
            .attr('cy', d => d.y)
            .attr('r', 0)
            .attr('fill', d => {
                if (d.type === 'FT') return '#ffd700';
                return d.made ? '#00ff88' : '#ff6b6b';
            })
            .attr('fill-opacity', d => d.type === 'FT' ? 1 : 0.7)
            .attr('stroke', d => {
                if (d.type === 'FT') return '#ffd700';
                return d.made ? '#00ff88' : '#ff6b6b';
            })
            .attr('stroke-width', 2)
            .on('mouseover', function(event, d) {
                d3.select(this)
                    .transition()
                    .duration(200)
                    .attr('r', 10)
                    .attr('fill-opacity', 1);
                
                tooltip.transition()
                    .duration(200)
                    .style('opacity', .9);
                tooltip.html(`${d.type}<br/>${d.made ? 'Made' : 'Missed'}`)
                    .style('left', (event.pageX + 10) + 'px')
                    .style('top', (event.pageY - 28) + 'px');
            })
            .on('mouseout', function(event, d) {
                d3.select(this)
                    .transition()
                    .duration(200)
                    .attr('r', 6)
                    .attr('fill-opacity', d.type === 'FT' ? 1 : 0.7);
                
                tooltip.transition()
                    .duration(500)
                    .style('opacity', 0);
            })
            .transition()
            .duration(600)
            .delay((d, i) => i * 20)
            .attr('r', 6);

        // Update statistics
        this.updateStats(playerData);
    }

    generateRealisticShots(playerData) {
        const shots = [];
        
        // Calculate shot counts based on attempts
        const ftAttempts = Math.round(playerData.FTA) || 0;
        const twoAttempts = Math.round(playerData['2PA']) || 0;
        const threeAttempts = Math.round(playerData['3PA']) || 0;
        
        // Scale down for visualization
        const scaleFactor = 50 / (ftAttempts + twoAttempts + threeAttempts) || 1;
        const ftCount = Math.max(1, Math.round(ftAttempts * scaleFactor));
        const twoCount = Math.max(1, Math.round(twoAttempts * scaleFactor));
        const threeCount = Math.max(1, Math.round(threeAttempts * scaleFactor));

        // Generate free throws (all from the same spot)
        for (let i = 0; i < ftCount; i++) {
            const made = Math.random() < playerData['FT%'];
            shots.push({
                x: this.ftLineX,
                y: this.basketY + (Math.random() - 0.5) * 10, // Small variation
                made: made,
                type: 'FT'
            });
        }

        // Generate 2-point shots
        for (let i = 0; i < twoCount; i++) {
            const made = Math.random() < playerData['2P%'];
            let x, y;
            
            // Different zones for 2-pointers
            const zone = Math.random();
            if (zone < 0.3) {
                // Close to basket (layups/dunks) - only in front of basket
                const angle = (Math.random() * Math.PI) - (Math.PI / 2); // -90 to +90 degrees
                const distance = Math.random() * 40 + 20;
                x = this.basketX + Math.cos(angle) * distance;
                y = this.basketY + Math.sin(angle) * distance;
            } else if (zone < 0.6) {
                // Mid-range from wings
                const side = Math.random() < 0.5 ? -1 : 1;
                x = this.basketX + Math.random() * (this.paintWidth * 0.8) + 40;
                y = this.basketY + side * (Math.random() * this.courtHeight * 0.25 + 20);
            } else {
                // Mid-range from top
                x = this.basketX + Math.random() * (this.threePointRadius * 0.7) + 40;
                y = this.basketY + (Math.random() - 0.5) * this.paintHeight * 0.8;
            }

            // Ensure shot is inside three-point line and in front of basket
            const distFromBasket = Math.sqrt(Math.pow(x - this.basketX, 2) + Math.pow(y - this.basketY, 2));
            if (distFromBasket > this.threePointRadius - 10) {
                x = this.basketX + (x - this.basketX) * (this.threePointRadius - 15) / distFromBasket;
                y = this.basketY + (y - this.basketY) * (this.threePointRadius - 15) / distFromBasket;
            }

            // Ensure x is always greater than basket position
            x = Math.max(this.basketX + 15, x);

            shots.push({
                x: Math.max(this.basketX + 15, Math.min(this.courtWidth - 10, x)),
                y: Math.max(10, Math.min(this.courtHeight - 10, y)),
                made: made,
                type: '2PT'
            });
        }

        // Generate 3-point shots
        for (let i = 0; i < threeCount; i++) {
            const made = Math.random() < playerData['3P%'];
            let x, y;
            
            const zone = Math.random();
            if (zone < 0.3) {
                // Corner threes
                const isTop = Math.random() < 0.5;
                x = Math.random() * (this.cornerThreeX - 10) + 10;
                y = isTop ? this.arcTopY + Math.random() * 20 : this.arcBottomY - Math.random() * 20;
            } else {
                // Arc threes - only in front of basket
                const angle = (Math.random() * Math.PI * 0.6) - (Math.PI * 0.3); // -54 to +54 degrees
                const distance = this.threePointRadius + Math.random() * 30 + 10;
                x = this.basketX + Math.cos(angle) * distance;
                y = this.basketY + Math.sin(angle) * distance;
            }

            // Ensure x is always greater than basket position for arc threes
            if (zone >= 0.3) {
                x = Math.max(this.basketX + this.threePointRadius, x);
            }

            shots.push({
                x: Math.max(10, Math.min(this.courtWidth - 10, x)),
                y: Math.max(10, Math.min(this.courtHeight - 10, y)),
                made: made,
                type: '3PT'
            });
        }

        return shots;
    }

    updateStats(playerData) {
        document.getElementById('fgPercentage').textContent = 
            playerData['FG%'] > 0 ? (playerData['FG%'] * 100).toFixed(1) + '%' : '0.0%';
        
        document.getElementById('threePercentage').textContent = 
            playerData['3P%'] > 0 ? (playerData['3P%'] * 100).toFixed(1) + '%' : '0.0%';
        
        document.getElementById('pointsPerGame').textContent = 
            playerData.PTS > 0 ? playerData.PTS.toFixed(1) : '0.0';
    }

    setupEventListeners() {
        const playerSelect = document.getElementById('playerSelect');
        playerSelect.addEventListener('change', (e) => {
            const player = e.target.value;
            if (player) {
                this.selectedPlayer = player;
                this.updateShots(player);
            } else {
                this.court.selectAll('.shot').remove();
                this.updateStats({});
            }
        });
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
    new CourtVisualization();
});