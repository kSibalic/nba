// UI utility functions
export class UIUtils {
    static addRowHoverEffects() {
        const rows = document.querySelectorAll('.stats-table tbody tr');
        
        rows.forEach((row, index) => {
            row.addEventListener('mouseenter', function() {
                this.style.transform = 'scale(1.02) translateZ(0)';
                this.style.boxShadow = '0 8px 25px rgba(0,0,0,0.15)';
            });
            
            row.addEventListener('mouseleave', function() {
                this.style.transform = 'scale(1) translateZ(0)';
                this.style.boxShadow = 'none';
            });
        });
    }

    static enhanceLoadingAnimation() {
        const loading = document.getElementById('loading');
        if (loading) {
            loading.innerHTML = `
                <div class="loading-spinner"></div>
                <p>Loading basketball statistics...</p>
                <div style="margin-top: 10px; font-size: 0.9rem; opacity: 0.7;">
                    📊 Parsing CSV data...
                </div>
            `;
        }
    }

    static showContent() {
        console.log('Showing content...');
        
        // Hide loading indicator
        const loading = document.getElementById('loading');
        loading.style.display = 'none';
        
        // Show datasets with animation
        const datasets = document.getElementById('datasets');
        datasets.style.display = 'grid';
        
        // Trigger animations by adding classes
        setTimeout(() => {
            const regularSection = document.querySelector('.regular-season');
            const playoffSection = document.querySelector('.playoffs');
            
            if (regularSection) regularSection.classList.add('slide-in-left');
            if (playoffSection) playoffSection.classList.add('slide-in-right');
        }, 100);
    }

    static showError(error) {
        console.error('Application error:', error);
        
        document.getElementById('loading').style.display = 'none';
        const errorDiv = document.getElementById('error');
        errorDiv.style.display = 'block';
        errorDiv.textContent = error.message;
    }
} 