// Client-side AI functionality for static deployment
// This replaces the server-side Genkit flows for Netlify deployment

export interface GenerateThemeInput {
  persona: string;
}

export interface GenerateThemeOutput {
  primaryColor: string;
  backgroundColor: string;
  accentColor: string;
  bodyFont: string;
}

export interface SummarizeSpendingInput {
  spendingData: string;
}

export interface SummarizeSpendingOutput {
  summary: string;
}

// Mock AI responses for static deployment
// In production, these would call external AI APIs or be replaced with actual API calls

export async function generateTheme(input: GenerateThemeInput): Promise<GenerateThemeOutput> {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 1500));
  
  // Mock theme generation based on persona
  const themes: Record<string, GenerateThemeOutput> = {
    'professional': {
      primaryColor: '220 25% 15%',
      backgroundColor: '210 20% 98%',
      accentColor: '210 40% 45%',
      bodyFont: 'Inter'
    },
    'creative': {
      primaryColor: '270 30% 25%',
      backgroundColor: '300 20% 97%',
      accentColor: '280 50% 55%',
      bodyFont: 'Poppins'
    },
    'minimalist': {
      primaryColor: '0 0% 10%',
      backgroundColor: '0 0% 99%',
      accentColor: '120 30% 40%',
      bodyFont: 'Roboto'
    },
    'luxury': {
      primaryColor: '240 30% 20%',
      backgroundColor: '240 15% 98%',
      accentColor: '45 80% 45%',
      bodyFont: 'Playfair Display'
    }
  };

  // Find closest match or default to professional
  const persona = input.persona.toLowerCase();
  const matchedTheme = Object.keys(themes).find(key => 
    persona.includes(key)
  ) || 'professional';

  return themes[matchedTheme];
}

export async function summarizeSpending(input: SummarizeSpendingInput): Promise<SummarizeSpendingOutput> {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  try {
    const data = JSON.parse(input.spendingData);
    const total = data.reduce((sum: number, item: any) => sum + item.amount, 0);
    const topCategory = data.reduce((max: any, item: any) => 
      item.amount > max.amount ? item : max, data[0]);
    
    const summary = `You've spent $${total.toFixed(2)} this month, with your largest expense being ${topCategory.category} at $${topCategory.amount}. ${
      total > 1200 
        ? 'Consider reducing dining out expenses to optimize your budget.' 
        : 'You\'re doing well staying within your budget this month!'
    } Your spending is ${total < 1000 ? 'below' : total > 1500 ? 'above' : 'within'} the typical range for your profile.`;
    
    return { summary };
  } catch (error) {
    return { 
      summary: 'Your spending data shows healthy financial habits with room for optimization in discretionary categories. Consider setting up automatic savings to reach your financial goals faster.' 
    };
  }
}

// Theme application function
export function applyTheme(theme: GenerateThemeOutput) {
  const root = document.documentElement;
  
  // Parse HSL values and apply to CSS variables
  const [primaryH, primaryS, primaryL] = theme.primaryColor.split(' ');
  const [bgH, bgS, bgL] = theme.backgroundColor.split(' ');
  const [accentH, accentS, accentL] = theme.accentColor.split(' ');
  
  root.style.setProperty('--primary', theme.primaryColor);
  root.style.setProperty('--background', theme.backgroundColor);
  root.style.setProperty('--accent', theme.accentColor);
  
  // Apply font if it's a Google Font
  if (theme.bodyFont !== 'Inter') {
    const link = document.createElement('link');
    link.href = `https://fonts.googleapis.com/css2?family=${theme.bodyFont.replace(' ', '+')}:wght@300;400;500;600;700&display=swap`;
    link.rel = 'stylesheet';
    document.head.appendChild(link);
    
    root.style.setProperty('--font-sans', `"${theme.bodyFont}", sans-serif`);
  }
}