import { useState } from "react";
import { Card } from "@/components/ui/card";
import ProgressSteps from "./ProgressSteps";
import DateStep from "./DateStep";
import PartySizeStep from "./PartySizeStep";
import TimeSlotStep from "./TimeSlotStep";
import ContactStep from "./ContactStep";
import ConfirmationStep from "./ConfirmationStep";

export interface ReservationData {
  date: Date | null;
  partySize: number | null;
  timeSlot: string | null;
  name: string;
  email: string;
  phone: string;
  notes: string;
}

const ReservationWidget = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [reservationData, setReservationData] = useState<ReservationData>({
    date: null,
    partySize: null,
    timeSlot: null,
    name: "",
    email: "",
    phone: "",
    notes: "",
  });

  const updateReservation = (data: Partial<ReservationData>) => {
    setReservationData((prev) => ({ ...prev, ...data }));
  };

  const nextStep = () => {
    setCurrentStep((prev) => Math.min(prev + 1, 5));
  };

  const prevStep = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 1));
  };

  const resetReservation = () => {
    setCurrentStep(1);
    setReservationData({
      date: null,
      partySize: null,
      timeSlot: null,
      name: "",
      email: "",
      phone: "",
      notes: "",
    });
  };

  return (
    <Card className="p-6 shadow-medium animate-fade-in">
      {currentStep < 5 && (
        <ProgressSteps currentStep={currentStep} totalSteps={4} />
      )}

      <div className="mt-8">
        {currentStep === 1 && (
          <DateStep
            selectedDate={reservationData.date}
            onSelectDate={(date) => {
              updateReservation({ date });
              nextStep();
            }}
          />
        )}

        {currentStep === 2 && (
          <PartySizeStep
            selectedSize={reservationData.partySize}
            onSelectSize={(size) => {
              updateReservation({ partySize: size });
              nextStep();
            }}
            onBack={prevStep}
          />
        )}

        {currentStep === 3 && (
          <TimeSlotStep
            selectedDate={reservationData.date!}
            partySize={reservationData.partySize!}
            selectedTimeSlot={reservationData.timeSlot}
            onSelectTimeSlot={(slot) => {
              updateReservation({ timeSlot: slot });
              nextStep();
            }}
            onBack={prevStep}
          />
        )}

        {currentStep === 4 && (
          <ContactStep
            data={reservationData}
            onSubmit={(contactData) => {
              updateReservation(contactData);
              nextStep();
            }}
            onBack={prevStep}
          />
        )}

        {currentStep === 5 && (
          <ConfirmationStep
            reservation={reservationData}
            onNewReservation={resetReservation}
          />
        )}
      </div>
    </Card>
  );
};

export default ReservationWidget;
