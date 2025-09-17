'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Palette } from 'lucide-react'
import { generateTheme, applyTheme } from '@/lib/ai-client'
import { useToast } from '@/hooks/use-toast'

const personas = ['professional', 'creative', 'minimalist', 'luxury', 'modern', 'classic'];

export function ThemeGenerator() {
  const [isGenerating, setIsGenerating] = useState(false)
  const { toast } = useToast()

  const handleGenerateTheme = async () => {
    setIsGenerating(true)
    try {
      const randomPersona = personas[Math.floor(Math.random() * personas.length)];
      const theme = await generateTheme({ persona: randomPersona });
      
      applyTheme(theme);
      
      toast({
        title: "Theme Generated!",
        description: `Applied a ${randomPersona} theme with ${theme.bodyFont} font.`,
      });
    } catch (error) {
      toast({
        title: "Theme Generation Failed",
        description: "Please try again later.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleGenerateTheme}
      disabled={isGenerating}
    >
      <Palette className="h-4 w-4 mr-2" />
      {isGenerating ? 'Generating...' : 'AI Theme'}
    </Button>
  )
}