import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Button } from 'primereact/button';
import { Dialog } from 'primereact/dialog';
import { InputText } from 'primereact/inputtext';
import { InputTextarea } from 'primereact/inputtextarea';
import { Toast } from 'primereact/toast';
import { Calendar } from 'primereact/calendar';
import { InputNumber } from 'primereact/inputnumber';
import { Dropdown } from 'primereact/dropdown';
import "../../../node_modules/primeflex/primeflex.css";

const formatDate = (value) => {
    if (!value) {
        return ''; 
    }
    try {
        const date = new Date(value);
        // Check if the date is valid
        if (isNaN(date.getTime())) {
            if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
            console.warn("Invalid date value received:", value);
            return 'Invalid Date';
        }
        return date.toISOString().split('T')[0]; 
    } catch (error) {
        console.error("Error formatting date:", value, error);
        return 'Error'; 
    }
};


const CompanyRoundTable = ({ companyId }) => {
    const [rounds, setRounds] = useState([]);
    const [isDialogVisible, setIsDialogVisible] = useState(false);
    const [round, setRound] = useState(null);
    const [isEditing, setIsEditing] = useState(false);
    const toast = useRef(null);

    useEffect(() => {
        if (companyId) { 
        fetchRounds();
        } else {
            setRounds([]); 
        }
    }, [companyId]); 

    const fetchRounds = async () => {
        try {
            const token = localStorage.getItem("token");
            const response = await axios.get(`http://localhost:3000/api/interviewRound/getByCompanyId/${companyId}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            setRounds(response.data); 
        } catch (error) {
            toast.current.show({ severity: 'error', summary: 'Error', detail: 'Failed to fetch rounds.', life: 3000 });
            console.error('Error fetching rounds:', error);
        }
    };

    const openNewRoundDialog = () => {
        setRound({ company_id: companyId, round_name: '', round_date: null, description: '', round_number: null, round_type: '' });
        setIsEditing(false);
        setIsDialogVisible(true);
    };

    const openEditRoundDialog = (roundData) => {
        const dateForCalendar = roundData.round_date ? new Date(roundData.round_date) : null;
        setRound({ ...roundData, round_date: dateForCalendar });
        setIsEditing(true);
        setIsDialogVisible(true);
    };

    const saveRound = async () => {
        try {
            const token = localStorage.getItem("token");
            const payload = { ...round };
            if (isEditing) {
                await axios.put(`http://localhost:3000/api/interviewRound/update/${payload.round_id}`, payload, {
                    headers: { Authorization: `Bearer ${token}` },
                });
                toast.current.show({ severity: 'success', summary: 'Success', detail: 'Round updated successfully.', life: 3000 });
            } else {
                payload.company_id = companyId;
                await axios.post(`http://localhost:3000/api/interviewRound/insert`, payload, {
                    headers: { Authorization: `Bearer ${token}` },
                });
                toast.current.show({ severity: 'success', summary: 'Success', detail: 'New round created successfully.', life: 3000 });
            }
            fetchRounds();
            setIsDialogVisible(false);
            setRound(null);
        } catch (error) {
            const errorMsg = error.response?.data?.error || 'Failed to save the round.';
            toast.current.show({ severity: 'error', summary: 'Error', detail: errorMsg, life: 3000 });
            console.error('Error saving round:', error.response || error);
        }
    };


    const deleteRound = async (roundId) => {
        try {
            const token = localStorage.getItem("token");
            await axios.delete(`http://localhost:3000/api/interviewRound/delete/${roundId}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            toast.current.show({ severity: 'success', summary: 'Success', detail: 'Round deleted successfully.', life: 3000 });
            fetchRounds();
        } catch (error) {
            toast.current.show({ severity: 'error', summary: 'Error', detail: 'Failed to delete round.', life: 3000 });
            console.error('Error deleting round:', error);
        }
    };

    const roundTypes = [
        { label: 'Pre Placement Talk', value: 'ppt' },
        { label: 'Shortlisting', value: 'shortlist' },
        { label: 'Final Round', value: 'final' }
    ];

    const onInputNumberChange = (e, name) => {
        const val = e.value;
        setRound((prevRound) => ({ ...prevRound, [name]: val }));
    };

    const onInputChange = (e, name) => {
        const val = e.target ? e.target.value : e.value;
        setRound((prevRound) => ({ ...prevRound, [name]: val }));
    };

    const dateBodyTemplate = (rowData) => {
        return formatDate(rowData.round_date);
    };

    const deleteButtonTemplate = (rowData) => {
        return <Button icon="pi pi-trash" rounded text severity="danger" aria-label="Delete" onClick={() => deleteRound(rowData.round_id)} />;
    };

    const editButtonTemplate = (rowData) => {
        return <Button icon="pi pi-pencil" rounded text severity="success" aria-label="Edit" onClick={() => openEditRoundDialog(rowData)} />;
    };

    const dialogFooter = (
        <>
            <Button label="Cancel" icon="pi pi-times" outlined onClick={() => setIsDialogVisible(false)} className="p-button-text"/>
            <Button label="Save" icon="pi pi-check" outlined onClick={saveRound} autoFocus/>
        </>
    );

    return (
        <div className="card">
            <Toast ref={toast} />
            <div className="flex justify-content-end mb-3">
                <Button label="Add New Round" size='small' icon="pi pi-plus" outlined onClick={openNewRoundDialog} />
            </div>

            <DataTable value={rounds} emptyMessage="No rounds found for this company" size="small" stripedRows paginator rows={10} rowsPerPageOptions={[5, 10, 25, 50]}>
                <Column field="round_number" header="Round #" sortable style={{ width: '10%' }}/>
                <Column field="round_name" header="Round Name" sortable filter filterPlaceholder="Search name" style={{ minWidth: '12rem' }} />
                <Column field="round_type" header="Round Type" sortable filter filterPlaceholder="Search type" style={{ minWidth: '10rem' }}/>
                <Column field="round_date" header="Round Date" body={dateBodyTemplate} sortable style={{ minWidth: '10rem' }}/>
                <Column field="description" header="Description" style={{ minWidth: '15rem' }}/>
                <Column header="Actions" body={editButtonTemplate} exportable={false} style={{ minWidth: '6rem' }} />
                <Column body={deleteButtonTemplate} exportable={false} style={{ minWidth: '6rem' }}/>
            </DataTable>

            <Dialog
                visible={isDialogVisible}
                style={{ width: '32rem' }} 
                breakpoints={{ '960px': '75vw', '641px': '90vw' }}
                header={<span className="p-dialog-title">{isEditing ? 'Edit Round' : 'Create New Round'}</span>}
                modal
                className="p-fluid" 
                footer={dialogFooter}
                onHide={() => { setIsDialogVisible(false); setRound(null); }}
            >
                <div className="formgrid grid">
                    <div className="field col-12 md:col-6">
                        <label htmlFor="round_number">Round Number *</label>
                        <InputNumber
                            id="round_number"
                            value={round?.round_number}
                            onValueChange={(e) => onInputNumberChange(e, 'round_number')}
                            mode="decimal"
                            showButtons
                            min={0}
                            required
                            className={!round?.round_number && round?.round_number !== 0 ? 'p-invalid' : ''}
                        />
                    </div>
                    <div className="field col-12 md:col-6">
                        <label htmlFor="round_date">Round Date</label>
                        <Calendar
                            id="round_date"
                            value={round?.round_date} 
                            onChange={(e) => onInputChange(e, 'round_date')}
                            dateFormat="yy-mm-dd" 
                            showIcon
                        />
                    </div>
                    <div className="field col-12">
                        <label htmlFor="round_name">Round Name *</label>
                        <InputText
                            id="round_name"
                            value={round?.round_name || ''}
                            onChange={(e) => onInputChange(e, 'round_name')}
                            required
                            autoFocus
                            className={!round?.round_name ? 'p-invalid' : ''}
                        />
                    </div>

                    <div className="field col-12">
                        <label htmlFor="round_type">Round Type</label>
                        <Dropdown
                            id="round_type"
                            value={round?.round_type}
                            options={roundTypes}
                            onChange={(e) => onInputChange(e, 'round_type')}
                            placeholder="Select a round type"
                            optionLabel="label" 
                            optionValue="value" 
                        />
                    </div>

                    <div className="field col-12">
                        <label htmlFor="description">Description</label>
                        <InputTextarea
                            id="description"
                            rows={3}
                            value={round?.description || ''}
                            onChange={(e) => onInputChange(e, 'description')}
                        />
                    </div>
                </div>
            </Dialog>
        </div>
    );
};

export default CompanyRoundTable;