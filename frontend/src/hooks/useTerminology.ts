"use client";
import { useState, useEffect } from 'react';

export const useTerminology = () => {
    const [terms, setTerms] = useState({
        hospital: 'Hospital',
        patient: 'Patient',
        doctor: 'Doctor',
        mrd: 'MRD'
    });
    const [specialty, setSpecialty] = useState('General');
    const [enabledModules, setEnabledModules] = useState<string[]>(['core']);

    useEffect(() => {
        try {
            const storedSpecialty = localStorage.getItem('userSpecialty');
            const spec = storedSpecialty || 'General';
            setSpecialty(spec);

            // Extract Modular Settings
            const storedModules = localStorage.getItem('userModules');
            if (storedModules) {
                setEnabledModules(JSON.parse(storedModules));
            }

            const storedTerminology = localStorage.getItem('userTerminology');
            const custom = storedTerminology ? JSON.parse(storedTerminology) : {};

            // Defaults based on specialty
            let defaultHospital = 'Hospital';
            let defaultPatient = 'Patient';
            let defaultDoctor = 'Doctor';
            // MRD defaults
            let defaultMRD = 'MRD';

            if (spec === 'Dental') {
                defaultHospital = 'Clinic';
                defaultPatient = 'Client';
                defaultDoctor = 'Dentist';
            } else if (spec === 'ENT') {
                defaultHospital = 'Clinic';
                defaultMRD = 'File';
            } else if (spec === 'Pharmaceuticals') {
                defaultHospital = 'Plant';
                defaultPatient = 'Batch / Product';
                defaultDoctor = 'QA Head';
                defaultMRD = 'Batch No';
            } else if (spec === 'Corporate') {
                defaultHospital = 'Company';
                defaultPatient = 'Folder';
                defaultDoctor = 'Department';
                defaultMRD = 'Ref No';
            } else if (spec === 'Legal') {
                defaultHospital = 'Firm';
                defaultPatient = 'Case';
                defaultDoctor = 'Advocate';
                defaultMRD = 'Case No';
            }

            setTerms({
                hospital: custom.hospital || defaultHospital,
                patient: custom.patient || defaultPatient,
                doctor: custom.doctor || defaultDoctor,
                mrd: custom.mrd || defaultMRD
            });
        } catch (e) {
            console.error("Failed to parse terminology from localStorage", e);
        }
    }, []);

    return { terms, specialty, enabledModules };
};

