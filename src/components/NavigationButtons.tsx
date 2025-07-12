
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
    const reportElement = document.querySelector('[data-report-content]') as HTMLElement;
    if (!reportElement) {
      console.error('Report content not found');
      return;
    }

    try {
      const canvas = await html2canvas(reportElement, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff'
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const imgWidth = canvas.width;
      const imgHeight = canvas.height;
      
      const ratio = Math.min(pdfWidth / imgWidth, pdfHeight / imgHeight);
      const imgX = (pdfWidth - imgWidth * ratio) / 2;
      const imgY = 30;

      pdf.addImage(imgData, 'PNG', imgX, imgY, imgWidth * ratio, imgHeight * ratio);
      pdf.save('assessment-report.pdf');
    } catch (error) {
      console.error('Error generating PDF:', error);
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
