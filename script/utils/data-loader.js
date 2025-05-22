// Data loading and processing utilities
export class DataLoader {
    static async loadData() {
        try {
            console.log('Loading CSV files...');
            
            // Load both CSV files using D3 with semicolon delimiter
            const [regularCsv, playoffCsv] = await Promise.all([
                d3.dsv(';', 'data/regular.csv'),
                d3.dsv(';', 'data/playoff.csv')
            ]);

            return {
                regularData: this.cleanData(regularCsv),
                playoffData: this.cleanData(playoffCsv)
            };
        } catch (error) {
            console.error('Error loading CSV files:', error);
            throw new Error('Failed to load CSV data. Please ensure the files are accessible and use semicolon (;) as delimiter.');
        }
    }

    static cleanData(data) {
        return data.map(d => {
            // Convert numeric fields
            const numericFields = ['Rk', 'Age', 'G', 'GS', 'MP', 'FG', 'FGA', 'FG%', '3P', '3PA', '3P%', 
                                 '2P', '2PA', '2P%', 'eFG%', 'FT', 'FTA', 'FT%', 'ORB', 'DRB', 'TRB', 
                                 'AST', 'STL', 'BLK', 'TOV', 'PF', 'PTS'];
            
            const cleaned = { ...d };
            
            numericFields.forEach(field => {
                if (cleaned[field] !== undefined && cleaned[field] !== '' && cleaned[field] !== null) {
                    const value = parseFloat(cleaned[field]);
                    cleaned[field] = isNaN(value) ? 0 : value;
                } else {
                    cleaned[field] = 0;
                }
            });

            // Clean string fields
            cleaned.Player = cleaned.Player || 'Unknown';
            cleaned.Pos = cleaned.Pos || 'N/A';
            cleaned.Tm = cleaned.Tm || 'N/A';

            return cleaned;
        });
    }
} 