'use client';
import React, { useEffect } from 'react';

export interface TicketData {
  token_number: string;
  patient_name: string;
  doctor_name: string;
  department_name: string;
  appointment_time: string;
  hospital_name: string;
  printed_at: string;
}

interface OPDTicketPrinterProps {
  ticket: TicketData | null;
  autoPrint?: boolean;
  onPrinted?: () => void;
}

export const OPDTicketPrinter: React.FC<OPDTicketPrinterProps> = ({
  ticket,
  autoPrint = true,
  onPrinted,
}) => {
  useEffect(() => {
    if (ticket && autoPrint) {
      const printTimer = setTimeout(() => {
        window.print();
        if (onPrinted) onPrinted();
      }, 300);
      return () => clearTimeout(printTimer);
    }
  }, [ticket, autoPrint, onPrinted]);

  if (!ticket) return null;

  return (
    <div className="hidden print:block print:w-80 print:p-4 print:font-mono print:text-black">
      <div className="text-center font-bold text-lg border-b pb-2 mb-2">
        {ticket.hospital_name}
      </div>
      <div className="text-center text-sm font-semibold mb-2">
        OPD CONSULTATION TICKET
      </div>

      <div className="text-center text-3xl font-extrabold my-3 border-2 border-black py-2 rounded">
        TOKEN #{ticket.token_number}
      </div>

      <div className="text-xs space-y-1 my-2 border-b pb-2">
        <div><strong>Patient:</strong> {ticket.patient_name}</div>
        <div><strong>Doctor:</strong> {ticket.doctor_name}</div>
        <div><strong>Dept:</strong> {ticket.department_name}</div>
        <div><strong>Time:</strong> {ticket.appointment_time}</div>
      </div>

      <div className="text-[10px] text-center text-gray-600 mt-2">
        Printed at: {ticket.printed_at}<br/>
        Please wait for your token to be called on screen.
      </div>
    </div>
  );
};
