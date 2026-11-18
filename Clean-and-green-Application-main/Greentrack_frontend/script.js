const fs = require('fs');
const path = require('path');

const componentsDir = 'c:/Users/patna/OneDrive/Documents/Final Year Project/Cleen-and-Green-Technology-main/Cleen-and-Green-Technology-main/greentrack-frontend/greentrack-frontend/src/components';

const files = fs.readdirSync(componentsDir).filter(f => f.endsWith('.js'));

files.forEach(file => {
    let content = fs.readFileSync(path.join(componentsDir, file), 'utf8');
    
    // Quick heuristic: If it has "showReading" or "showQuiz", it's a quiz component
    if(content.includes('showReading') && content.includes('showQuiz')) {
        
        if (!content.includes('useTheme')) {
            // Add import
            content = "import { useTheme } from '@mui/material';\n" + content;
            
            // Inject theme hook right after functional component definition
            content = content.replace(/const (\w+) = \(\) => {/, "const $1 = () => {\n  const theme = useTheme();\n  const isDark = theme.palette.mode === 'dark';");
        }
        
        // Fix inline styles with dynamic dark mode logic
        content = content.replace(/backgroundColor:\s*["']#f8f9fa["']/g, 'backgroundColor: isDark ? "#121212" : "#f8f9fa"');
        content = content.replace(/backgroundColor:\s*["']#e9f7ef["']/g, 'backgroundColor: isDark ? "rgba(67, 160, 71, 0.1)" : "#e9f7ef"');
        content = content.replace(/color:\s*["']#155d27["']/g, 'color: isDark ? "#81c784" : "#155d27"');
        content = content.replace(/color:\s*["']#198754["']/g, 'color: isDark ? "#66bb6a" : "#198754"');
        content = content.replace(/background:\s*["']#fff["']/g, 'background: isDark ? "#1e1e1e" : "#fff"');
        content = content.replace(/backgroundColor:\s*["']#a8e6a2["']/g, 'backgroundColor: isDark ? "rgba(67, 160, 71, 0.2)" : "#a8e6a2"');
        
        // Ensure regular text is legible in dark mode by replacing the main wrapper
        content = content.replace(/fontFamily: "'Poppins', sans-serif"/g, "fontFamily: \"'Poppins', sans-serif\", color: isDark ? '#fff' : '#000'");

        fs.writeFileSync(path.join(componentsDir, file), content);
        console.log(`Updated ${file}`);
    }
});
