import { removeBackground, loadImage } from './backgroundRemoval';
import logoImage from '@/assets/uchaguzi-logo.png';

export const processLogo = async (): Promise<string> => {
  try {
    // Load the logo image
    const response = await fetch(logoImage);
    const blob = await response.blob();
    const imageElement = await loadImage(blob);
    
    // Remove background
    const processedBlob = await removeBackground(imageElement);
    
    // Create object URL for the processed image
    return URL.createObjectURL(processedBlob);
  } catch (error) {
    console.error('Error processing logo:', error);
    // Fallback to original image
    return logoImage;
  }
};