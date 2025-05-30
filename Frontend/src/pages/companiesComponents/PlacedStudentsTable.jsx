// PlacedStudentsTable.js
import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Toast } from "primereact/toast";
import { Button } from "primereact/button";
import { Dialog } from "primereact/dialog";
import { IconField } from "primereact/iconfield";
import { InputIcon } from "primereact/inputicon";
import { InputText } from "primereact/inputtext";
import { InputNumber } from "primereact/inputnumber";
import { Calendar } from "primereact/calendar";
import { Dropdown } from "primereact/dropdown";
import { Checkbox } from "primereact/checkbox";
import { classNames } from "primereact/utils";
import { ProgressSpinner } from 'primereact/progressspinner'; 

import "primereact/resources/themes/lara-light-indigo/theme.css";
import "primereact/resources/primereact.min.css";
import "primeicons/primeicons.css";

const formatLocalDateToYYYYMMDD = (date) => {
    if (!date || !(date instanceof Date) || isNaN(date.getTime())) return null;
    try {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    } catch (e) { return null; }
};

const parseStringToLocalDate = (dateString) => {
    if (!dateString || typeof dateString !== 'string') return null;
    try {
        const datePart = dateString.split('T')[0];
        const parts = datePart.split('-');
        if (parts.length === 3) {
            const year = parseInt(parts[0], 10);
            const month = parseInt(parts[1], 10) - 1;
            const day = parseInt(parts[2], 10);
            if (!isNaN(year) && !isNaN(month) && !isNaN(day)) {
                const localDate = new Date(year, month, day, 0, 0, 0, 0);
                return localDate;
            }
        } return null;
    } catch (e) { return null; }
};

const PlacedStudentsTable = ({ companyId, companyName }) => {
    const emptyPlacement = {
        placement_id: null, student_id: null, company_id: companyId,
        position: "", location: "", salary: null, placement_date: null, 
        offer_type: "", offer_letter: false, core_non_core: "", rollNumber: null, 
    };

    const company_Id = Number(companyId);
    const [placements, setPlacements] = useState([]); 
    const [students, setStudents] = useState([]);
    const [joinedData, setJoinedData] = useState([]); 
    const [selectedPlacements, setSelectedPlacements] = useState([]);
    const [placementDialog, setPlacementDialog] = useState(false);
    const [deletePlacementDialog, setDeletePlacementDialog] = useState(false);
    const [placement, setPlacement] = useState(emptyPlacement); 
    const [rollNumberOptions, setRollNumberOptions] = useState([]);
    const [submitted, setSubmitted] = useState(false);
    const [globalFilter, setGlobalFilter] = useState("");
    const [loading, setLoading] = useState(true); 
    const toast = useRef(null);
    const dt = useRef(null);

    const getToken = () => localStorage.getItem("token");

    useEffect(() => {
        setLoading(true);
        Promise.all([getPlacementData(), getAllStudentData()])
            .catch(error => {
                console.error("Error loading initial data:", error);
                toast.current.show({ severity: 'error', summary: 'Error', detail: 'Failed to load initial data.', life: 3000 });
            })
            .finally(() => {
                setLoading(false);
            });
    }, [company_Id]); 

    async function getPlacementData() {
        try {
            const token = getToken();
            const response = await axios.get("http://localhost:3000/api/placement/getAllPlacements", { 
                headers: { Authorization: `Bearer ${token}` },
            });
            setPlacements(Array.isArray(response.data) ? response.data : []);
        } catch (error) {
            console.error("Error fetching placements:", error);
            toast.current.show({ severity: 'error', summary: 'Error', detail: 'Failed to load placements.', life: 3000 });
            setPlacements([]);
        }
    }

    async function getAllStudentData() {
        try {
            const token = getToken();
            const response = await axios.get("http://localhost:3000/api/student/getAllStudents", {
                headers: { Authorization: `Bearer ${token}` },
            });
            setStudents(Array.isArray(response.data) ? response.data : []);
        } catch (error) {
            console.error("Error fetching students:", error);
            toast.current.show({ severity: 'error', summary: 'Error', detail: 'Failed to load students.', life: 3000 });
            setStudents([]); 
        }
    }

    useEffect(() => {
        if (!placements || !students) return; 
        const filteredPlacements = placements.filter(p => p.company_id === company_Id);

        const updatedJoinedData = filteredPlacements.map((plcmt) => {
            const studentDetails = students.find(s => s.student_id === plcmt.student_id);
            return {
                ...plcmt, 
                rollNumber: studentDetails?.rollNumber, 
                name: studentDetails?.name,
                student_id: plcmt.student_id,
            };
        }).filter(item => item.rollNumber);

        setJoinedData(updatedJoinedData);
    }, [placements, students, company_Id]); 
    useEffect(() => {
        const options = students.map((student) => ({
            label: student.rollNumber,
            value: student.rollNumber, 
        }));
        setRollNumberOptions(options);
    }, [students]);

    const openNew = () => {
        setPlacement({ ...emptyPlacement, company_id: company_Id });
        setSubmitted(false);
        setPlacementDialog(true);
    };

    const hideDialog = () => {
        setSubmitted(false);
        setPlacementDialog(false);
        setPlacement(emptyPlacement); 
    };

    const editPlacement = (rowData) => {
        console.log("Editing Row Data:", rowData);
        const localDateObject = parseStringToLocalDate(rowData.placement_date); 

        setPlacement({
            ...rowData, 
            placement_date: localDateObject, 
            rollNumber: rowData.rollNumber || students.find(s => s.student_id === rowData.student_id)?.rollNumber
        });
        setPlacementDialog(true);
    };

    const confirmDeletePlacement = (rowData) => {
        setPlacement(rowData);
        setDeletePlacementDialog(true);
    };

    const hideDeletePlacementDialog = () => {
        setDeletePlacementDialog(false);
    };

    const onInputChange = (e, name) => {
        const value = (e.target && e.target.value !== undefined) ? e.target.value : e.value;
        const finalValue = (e.target && e.target.type === 'checkbox') ? e.target.checked : value;

        setPlacement(prev => ({ ...prev, [name]: finalValue }));
    };

    const onInputNumberChange = (e, name) => {
        setPlacement(prev => ({ ...prev, [name]: e.value }));
    };

    const handleRollNumberChange = (e) => {
        const selectedRollNumber = e.value; 
        const student = students.find(s => s.rollNumber === selectedRollNumber);
        setPlacement(prev => ({
            ...prev,
            rollNumber: selectedRollNumber,
            student_id: student ? student.student_id : null 
        }));
    };

    // --- Save / Update / Delete ---
    const savePlacement = async () => {
        setSubmitted(true);

        // Validation
        if (!placement.student_id || !placement.position || !placement.placement_date || placement.salary === null || placement.salary === undefined) {
            toast.current.show({ severity: 'warn', summary: 'Validation Error', detail: 'Roll Number, Position, Date, and Package are required.', life: 3000 });
            return;
        }
        // Ensure placement_date is a valid Date object before formatting
        if (!(placement.placement_date instanceof Date) || isNaN(placement.placement_date.getTime())) {
            toast.current.show({ severity: 'error', summary: 'Error', detail: 'Invalid placement date selected.', life: 3000 });
            return;
        }

        // Format the Date object to YYYY-MM-DD string for API
        const dateStringToSend = formatLocalDateToYYYYMMDD(placement.placement_date);
        if (!dateStringToSend) {
            toast.current.show({ severity: 'error', summary: 'Error', detail: 'Could not format placement date.', life: 3000 });
            return;
        }

        let payload = {
            student_id: placement.student_id,
            company_id: placement.company_id,
            position: placement.position,
            location: placement.location || null,
            salary: placement.salary,
            placement_date: dateStringToSend,
            offer_type: placement.offer_type || null,
            offer_letter: placement.offer_letter || false,
            core_non_core: placement.core_non_core || null,
        };

        setLoading(true); 
        try {
            const token = getToken();
            let response;
            if (placement.placement_id) {
                // Update
                response = await axios.put(
                    `http://localhost:3000/api/placement/updatePlacementById/${placement.placement_id}`,
                    payload,
                    { headers: { Authorization: `Bearer ${token}` } }
                );
                toast.current.show({ severity: "success", summary: "Success", detail: "Placement updated.", life: 3000 });
            } else {
                // Insert
                response = await axios.post(
                    "http://localhost:3000/api/placement/insertPlacement",
                    payload,
                    { headers: { Authorization: `Bearer ${token}` } }
                );
                toast.current.show({ severity: "success", summary: "Success", detail: "Placement added.", life: 3000 });
            }

            hideDialog();
            getPlacementData();

        } catch (error) {
            console.error("Error saving/updating placement:", error);
            let errorMsg = error.response?.data?.message || `Failed to ${placement.placement_id ? 'update' : 'save'} placement.`;
            if (error.response?.status === 409) { // Check for conflict status (duplicate placement)
                errorMsg = error.response.data.message; // Use the message from backend
                toast.current.show({ severity: 'warn', summary: 'Duplicate Placement', detail: errorMsg, life: 4000 });
            } else {
                toast.current.show({ severity: "error", summary: "Error", detail: errorMsg, life: 4000 });
            }
        } finally {
            setLoading(false); // Stop loading indicator
        }
    };

    const deletePlacement = async () => {
        if (!placement || !placement.placement_id) return;
        setLoading(true); // Indicate deleting process
        try {
            const token = getToken();
            await axios.delete(
                `http://localhost:3000/api/placement/deletePlacementById/${placement.placement_id}`,
                { headers: { Authorization: `Bearer ${token}` } }
            );
            toast.current.show({ severity: "success", summary: "Successful", detail: "Placement Deleted", life: 3000 });
            hideDeletePlacementDialog();
            getPlacementData(); // Refresh data
        } catch (error) {
            console.error("Error deleting placement:", error);
            const errorMsg = error.response?.data?.message || "Failed to delete placement.";
            toast.current.show({ severity: "error", summary: "Error", detail: errorMsg, life: 4000 });
        } finally {
            setLoading(false); // Stop loading indicator
        }
    };

    const offerLetterTemplate = (rowData) => {
        // Use standard icons for boolean display
        const icon = rowData.offer_letter ? 'pi pi-check-circle' : 'pi pi-times-circle';
        const color = rowData.offer_letter ? 'var(--green-500)' : 'var(--red-500)';
        return <i className={icon} style={{ color: color, fontSize: '1.2rem' }}></i>;
    };

    const actionBodyTemplate = (rowData) => (
        <div className="flex gap-2">
            <Button
                icon="pi pi-pencil"
                rounded
                text
                tooltip="Edit"
                tooltipOptions={{ position: 'top' }}
                className="p-button-success"
                onClick={() => editPlacement(rowData)}
            />
            <Button
                icon="pi pi-trash"
                rounded
                text
                tooltip="Delete"
                tooltipOptions={{ position: 'top' }}
                className="p-button-warning"
                onClick={() => confirmDeletePlacement(rowData)}
            />
        </div>
    );
    const header = (
        <div className="flex flex-wrap align-items-center justify-content-between gap-2 p-4">
            <h2>Manage Placements for {companyName}</h2>
            <div className="flex flex-wrap gap-2">
                <IconField iconPosition="left">
                    <InputIcon className="pi pi-search" />
                    <InputText
                        value={globalFilter}
                        onChange={(e) => setGlobalFilter(e.target.value)}
                        placeholder="Search..."
                        style={{ minWidth: "300px" }}
                    />
                </IconField>
                <Button
                    label="New"
                    icon="pi pi-plus"
                    severity="success"
                    outlined
                    onClick={openNew}
                />
                <Button
                    label="Export"
                    icon="pi pi-upload"
                    severity="help"
                    outlined
                    onClick={() => dt.current?.exportCSV()} // Safer access
                    disabled={!joinedData || joinedData.length === 0}
                />
            </div>
        </div>
    );

    const placementDialogFooter = (
        <>
            <Button label="Cancel" icon="pi pi-times" outlined severity="danger" onClick={hideDialog} />
            <Button label="Save" icon="pi pi-check" outlined severity="success" onClick={savePlacement} loading={loading} /> {/* Show loading on save */}
        </>
    );

    const deletePlacementDialogFooter = (
        <>
            <Button label="No" icon="pi pi-times" outlined className="p-button-text" onClick={hideDeletePlacementDialog} />
            <Button label="Yes" icon="pi pi-check" severity="danger" onClick={deletePlacement} loading={loading} /> {/* Show loading on delete */}
        </>
    );

    // --- Render ---
    if (loading && joinedData.length === 0) { // Show spinner only on initial load
        return <div className="flex justify-content-center align-items-center" style={{ height: '200px' }}><ProgressSpinner /></div>;
    }

    return (
        <div className="datatable-crud-demo"> 
            <Toast ref={toast} />
            <div className="card shadow-2 border-round">
                <DataTable
                    ref={dt}
                    value={joinedData}
                    selection={selectedPlacements}
                    onSelectionChange={(e) => setSelectedPlacements(e.value)}
                    dataKey="placement_id" 
                    paginator rows={10} rowsPerPageOptions={[5, 10, 25, 50]}
                    paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
                    currentPageReportTemplate="Showing {first} to {last} of {totalRecords} placements"
                    globalFilter={globalFilter} header={header}
                    size="small" showGridlines stripedRows
                    emptyMessage="No placements found for this company."
                    loading={loading}
                    sortMode="multiple" 
                    resizableColumns columnResizeMode="fit" tableStyle={{ minWidth: "100%" }}
                    scrollable scrollHeight="400px" 
                >
                    <Column field="rollNumber" header="Roll No." sortable style={{ minWidth: "8rem" }} />
                    <Column field="name" header="Student Name" sortable style={{ minWidth: "12rem" }} filter filterPlaceholder="Search Name" />
                    <Column field="position" header="Position" sortable style={{ minWidth: "12rem" }} />
                    <Column field="location" header="Location" sortable style={{ minWidth: "10rem" }} filter filterPlaceholder="Search Location" />
                    <Column
                        field="salary" header="Salary (INR)" sortable style={{ minWidth: "10rem" }}
                        body={(rowData) => rowData.salary ? parseFloat(rowData.salary).toLocaleString('en-IN', { maximumFractionDigits: 0 }) : 'N/A'}
                    />
                    <Column
                        field="placement_date" header="Placement Date" sortable style={{ minWidth: "10rem" }}
                    />
                    <Column field="offer_type" header="Offer Type" sortable style={{ minWidth: "10rem" }} />
                    <Column
                        field="offer_letter" header="Offer Letter" body={offerLetterTemplate} sortable style={{ minWidth: "8rem", textAlign: 'center' }}
                    />
                    <Column field="core_non_core" header="Domain" sortable style={{ minWidth: "10rem" }} filter filterPlaceholder="Search Domain" />
                    <Column
                        header="Actions" body={actionBodyTemplate} exportable={false} frozen alignFrozen="right"
                        style={{ minWidth: '8rem' }}
                    />
                </DataTable>
            </div>

            {/* Add/Edit Dialog */}
            <Dialog
                visible={placementDialog}
                style={{ width: "32rem" }}
                breakpoints={{ '960px': '75vw', '641px': '90vw' }}
                header="Placement Details" modal className="p-fluid"
                footer={placementDialogFooter} onHide={hideDialog}
            >
                {/* Company Name (disabled) */}
                <div className="field mt-3"> {/* Added margin */}
                    <label htmlFor="companyName" className="font-semibold">Company Name</label>
                    <InputText id="companyName" value={companyName} disabled />
                </div>
                {/* Roll Number */}
                <div className="field mt-3">
                    <label htmlFor="rollNumber" className="font-semibold">Roll Number*</label>
                    <Dropdown id="rollNumber" value={placement.rollNumber} options={rollNumberOptions}
                        onChange={handleRollNumberChange} placeholder="Select Roll Number" filter
                        className={classNames({ "p-invalid": submitted && !placement.student_id })}
                        disabled={!!placement.placement_id}
                        tooltip={placement.placement_id ? "Cannot change student for existing record" : ""}
                        tooltipOptions={{ position: 'top' }}
                    />
                    {submitted && !placement.student_id && (<small className="p-error">Roll Number is required.</small>)}
                </div>
                {/* Position */}
                <div className="field mt-3">
                    <label htmlFor="position" className="font-semibold">Position*</label>
                    <InputText id="position" value={placement.position || ''} onChange={(e) => onInputChange(e, "position")} required className={classNames({ "p-invalid": submitted && !placement.position })} placeholder="Eg. Software Engineer" />
                    {submitted && !placement.position && (<small className="p-error">Position is required.</small>)}
                </div>
                {/* Location */}
                <div className="field mt-3">
                    <label htmlFor="location" className="font-semibold">Location</label>
                    <InputText id="location" value={placement.location || ''} onChange={(e) => onInputChange(e, "location")} placeholder="Eg. Mumbai" />
                </div>
                {/* Salary */}
                <div className="field mt-3">
                    <label htmlFor="salary" className="font-semibold">Package (Annual CTC in INR)*</label>
                    <InputNumber id="salary" value={placement.salary} onValueChange={(e) => onInputNumberChange(e, "salary")} mode="decimal" minFractionDigits={0} maxFractionDigits={2} required className={classNames({ 'p-invalid': submitted && (placement.salary === null || placement.salary <= 0) })} placeholder="Enter annual salary in INR" />
                    {submitted && (placement.salary === null || placement.salary <= 0) && (<small className="p-error">A valid package amount is required.</small>)}
                </div>
                {/* Placement Date */}
                <div className="field mt-3">
                    <label htmlFor="placement_date" className="font-semibold">Placement Date*</label>
                    <Calendar
                        id="placement_date"
                        value={placement.placement_date} 
                        onChange={(e) => onInputChange(e, "placement_date")}
                        dateFormat="yy-mm-dd" 
                        showIcon required showButtonBar 
                        className={classNames({ "p-invalid": submitted && !placement.placement_date })}
                        monthNavigator yearNavigator yearRange="2020:2030"
                    />
                    {submitted && !placement.placement_date && (<small className="p-error">Placement Date is required.</small>)}
                </div>
                {/* Offer Type */}
                <div className="field mt-3">
                    <label htmlFor="offer_type" className="font-semibold">Offer Type</label>
                    <Dropdown id="offer_type" value={placement.offer_type} onChange={(e) => onInputChange(e, "offer_type")} options={["Full-Time", "Internship", "PPO"]} placeholder="Select Offer Type" showClear />
                </div>
                {/* Domain */}
                <div className="field mt-3">
                    <label htmlFor="core_non_core" className="font-semibold">Domain</label>
                    <Dropdown id="core_non_core" value={placement.core_non_core} onChange={(e) => onInputChange(e, "core_non_core")} options={["Core", "Non-Core", "Techno-Managerial"]} placeholder="Select Domain" showClear />
                </div>
                {/* Offer Letter */}
                <div className="field flex align-items-center gap-2 mt-4"> {/* Use flex for alignment */}
                    <Checkbox inputId="offer_letter" checked={!!placement.offer_letter} onChange={(e) => onInputChange(e, "offer_letter")} />
                    <label htmlFor="offer_letter" className="font-semibold mb-0">Offer Letter Received?</label>
                </div>
            </Dialog>

            {/* Delete Confirmation Dialog */}
            <Dialog
                visible={deletePlacementDialog} style={{ width: "30rem" }}
                breakpoints={{ '960px': '75vw', '641px': '90vw' }}
                header="Confirm Deletion" modal footer={deletePlacementDialogFooter}
                onHide={hideDeletePlacementDialog}
            >
                <div className="flex align-items-center">
                    <i className="pi pi-exclamation-triangle mr-3 text-orange-500" style={{ fontSize: "2rem" }} />
                    {placement && (<span>Are you sure you want to delete the placement record for <b>{placement.rollNumber || `ID: ${placement.student_id}`}</b>?</span>)}
                </div>
            </Dialog>
        </div>
    );
};

export default PlacedStudentsTable;