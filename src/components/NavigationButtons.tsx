
import React from 'react';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { ArrowLeft, ArrowRight, Download, ChevronDown, FileDown } from 'lucide-react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

interface NavigationButtonsProps {
  currentScreen: number;
  totalScreens: number;
  isReportScreen: boolean;
  onPrevious: () => void;
  onNext: () => void;
  onSubmitAssessment: () => void;
}

export function NavigationButtons({
  currentScreen,
  totalScreens,
  isReportScreen,
  onPrevious,
  onNext,
  onSubmitAssessment
}: NavigationButtonsProps) {
  const handleDownloadPDF = async () => {
    // Wait a bit for the DOM to be ready
    await new Promise(resolve => setTimeout(resolve, 100));
    
    let reportElement = document.querySelector('[data-report-content]') as HTMLElement;
    
    // If not found by data attribute, try to find by class or other means
    if (!reportElement) {
      // Look for the report container by finding elements that likely contain report content
      const possibleElements = document.querySelectorAll('div');
      for (const element of possibleElements) {
        if (element.innerHTML.includes('Assessment Report') || 
            element.innerHTML.includes('Overall Performance') ||
            element.innerHTML.includes('Chart Legend')) {
          reportElement = element as HTMLElement;
          break;
        }
      }
    }
    
    if (!reportElement) {
      console.error('Could not find report content for PDF generation');
      alert('Unable to generate PDF. Please try again.');
      return;
    }

    try {
      // Set a fixed width for consistent rendering
      const originalStyle = reportElement.style.cssText;
      reportElement.style.width = '210mm'; // A4 width
      reportElement.style.maxWidth = '210mm';
      
      const canvas = await html2canvas(reportElement, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        width: 794, // A4 width in pixels at 96dpi
        scrollX: 0,
        scrollY: 0
      });

      // Restore original styles
      reportElement.style.cssText = originalStyle;

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const imgWidth = canvas.width;
      const imgHeight = canvas.height;
      
      // Calculate scaling to fit the page
      const ratio = Math.min(pdfWidth / (imgWidth * 0.264583), (pdfHeight - 20) / (imgHeight * 0.264583));
      const scaledWidth = imgWidth * 0.264583 * ratio;
      const scaledHeight = imgHeight * 0.264583 * ratio;
      
      const imgX = (pdfWidth - scaledWidth) / 2;
      const imgY = 10;

      pdf.addImage(imgData, 'PNG', imgX, imgY, scaledWidth, scaledHeight);
      pdf.save('assessment-report.pdf');
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Error generating PDF. Please try again.');
    }
  };
  return (
    <div className="flex justify-between items-center mt-8">
      <Button
        variant="outline"
        onClick={onPrevious}
        disabled={currentScreen === 0}
        className="flex items-center space-x-2"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Previous</span>
      </Button>

      <div className="text-sm text-muted-foreground">
        Screen {currentScreen + 1} of {totalScreens}
      </div>

      {isReportScreen ? (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button className="flex items-center space-x-2">
              <Download className="w-4 h-4" />
              <span>Submit Assessment</span>
              <ChevronDown className="w-4 h-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="bg-background border border-border">
            <DropdownMenuItem onClick={onSubmitAssessment} className="flex items-center space-x-2">
              <Download className="w-4 h-4" />
              <span>Submit Assessment</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleDownloadPDF} className="flex items-center space-x-2">
              <FileDown className="w-4 h-4" />
              <span>Download as PDF</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ) : (
        <Button
          onClick={onNext}
          disabled={currentScreen === totalScreens - 1}
          className="flex items-center space-x-2"
        >
          <span>Next</span>
          <ArrowRight className="w-4 h-4" />
        </Button>
      )}
    </div>
  );
}
