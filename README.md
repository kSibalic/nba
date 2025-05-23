# NBA Basketball Statistics Visualization

## 🚀 Postavke projekta

### ⚠️ VAŽNO: CSV datoteke

Projekt koristi CSV datoteke sa semicolon (`;`) separatorom.

1. **regular.csv** - Statistike regularne sezone
2. **playoff.csv** - Statistike playoff-a

#### Očekivana struktura CSV datoteka:

```csv
Rk;Player;Pos;Age;Tm;G;GS;MP;FG;FGA;FG%;3P;3PA;3P%;2P;2PA;2P%;eFG%;FT;FTA;FT%;ORB;DRB;TRB;AST;STL;BLK;TOV;PF;PTS
1;LeBron James;SF;38;LAL;82;82;35.5;10.2;20.5;0.498;2.5;7.2;0.347;7.7;13.3;0.579;0.559;4.1;5.5;0.745;1.2;6.8;8.0;8.2;1.3;0.6;3.5;1.8;27.0
```

### 📝 Pojedinosti i prakse u kodu

1. **Uklonjena ES6 modul sintaksa** - Svi JavaScript fileovi rade direktno u browseru
2. **Pojednostavljena struktura** - Svaka stranica ima svoj JavaScript file
3. **D3.js integracija** - Koristi se isključivo D3.js za sve vizualizacije

### 🎯 Funkcionalnosti

1. **Home (index.html)**
   - Prikazuje tablice sa statistikama
   - Regularna sezona vs Playoff usporedba
   - Sumarne statistike

2. **Visual Court**
   - Vizualizacija košarkaškog terena
   - Prikaz lokacija šuteva
   - Statistike šutiranja po igraču

3. **Graphs**
   - Trend analiza performansi
   - Usporedba timova
   - Distribucija poena
   - Impact score igrača

4. **Diagrams**
   - Top 15 strijelaca
   - Efikasnost šutiranja
   - Radar chart za top 5 igrača
   - Performance matrix

### 🏃 Pokretanje

1. Preuzmite projekt s GitHub-a
2. Otvorite `index.html` u web browseru
3. Koristite navigaciju za prelazak između stranica

### 🐛 Debugging

Ako aplikacija ne radi:

1. Otvorite Developer Console (F12)
2. Provjerite postoje li greške
3. Provjerite jesu li CSV fileovi na pravom mjestu
4. Provjerite koriste li CSV fileovi `;` kao separator

### 📊 Format podataka

Numerička polja koja se automatski parsiraju:
- Rk, Age, G, GS, MP
- FG, FGA, FG%, 3P, 3PA, 3P%
- 2P, 2PA, 2P%, eFG%
- FT, FTA, FT%
- ORB, DRB, TRB
- AST, STL, BLK, TOV, PF, PTS

String polja:
- Player (ime igrača)
- Pos (pozicija)
- Tm (tim)