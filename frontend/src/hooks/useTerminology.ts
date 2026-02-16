"use client";
import { useState, useEffect } from 'react';

export const useTerminology = () => {
    const [terms, setTerms] = useState({
        hospital: 'Hospital',
        patient: 'Patient',
        mrd: 'MRD'
    });
    const [specialty, setSpecialty] = useState('General');

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (token) {
            try {
                const base64Url = token.split('.')[1];
                const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
                const jsonPayload = decodeURIComponent(atob(base64).split('').map((c) => {
                    return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
                }).join(''));
                const decoded = JSON.parse(jsonPayload);

                const spec = decoded.specialty || 'General';
                setSpecialty(spec);

                const custom = decoded.terminology || {};

                // Defaults based on specialty
                let defaultHospital = 'Hospital';
                let defaultPatient = 'Patient';
                let defaultMRD = 'MRD';

                if (spec === 'Dental') {
                    defaultHospital = 'Clinic';
                    defaultPatient = 'Client';
                } else if (spec === 'ENT') {
                    defaultHospital = 'Clinic';
                    defaultMRD = 'File';
                }

                setTerms({
                    hospital: custom.hospital || defaultHospital,
                    patient: custom.patient || defaultPatient,
                    mrd: custom.mrd || defaultMRD
                });
            } catch (e) {
                console.error("Failed to decode token for terminology", e);
            }
        }
    }, []);

    return { terms, specialty };
};
