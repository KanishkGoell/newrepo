import React, { useState, useEffect } from 'react';
import { AgGridReact } from 'ag-grid-react';
import { LicenseManager } from 'ag-grid-enterprise';
import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-alpine.css';
import moment from 'moment';

// Set your license key
LicenseManager.setLicenseKey('YOUR_TRIAL_LICENSE_KEY'); // Replace with your trial license key

const MyAgGrid = ({ savePreferences, setGridApi }) => {
    const [rowData, setRowData] = useState([]);
    const [gridApi, setGridApiState] = useState(null);
    

    const dateComparator = (filterLocalDateAtMidnight, cellValue) => {
        const cellDate = moment(cellValue, 'MM/DD/YYYY').toDate();
        if (cellDate < filterLocalDateAtMidnight) {
            return -1;
        } else if (cellDate > filterLocalDateAtMidnight) {
            return 1;
        }
        return 0;
    };

    const parseSalary = value => {
        const cleanedValue = value.replace(/[$,]/g, '');
        const number = parseFloat(cleanedValue);
        return isNaN(number) ? 0 : number;
    };

    const parseBonus = value => {
        const cleanedValue = value.replace(/[%]/g, '');
        const number = parseFloat(cleanedValue);
        return isNaN(number) ? 0 : number;
    };

    const columnDefs = [
        { field: 'Employee ID', filter: 'agTextColumnFilter', sortable: true },
        { field: 'Full Name', filter: 'agTextColumnFilter', sortable: true },
        { field: 'Job Title', filter: 'agTextColumnFilter', sortable: true },
        { field: 'Department', filter: 'agTextColumnFilter', sortable: true },
        { field: 'Business Unit', filter: 'agTextColumnFilter', sortable: true },
        { field: 'Gender', filter: 'agTextColumnFilter', sortable: true },
        { field: 'Ethnicity', filter: 'agTextColumnFilter', sortable: true },
        { field: 'Age', filter: 'agNumberColumnFilter', sortable: true },
        { field: 'Annual Salary', filter: 'agNumberColumnFilter', sortable: true },
        { field: 'Bonus %', filter: 'agNumberColumnFilter', sortable: true },
        { field: 'Country', filter: 'agTextColumnFilter', sortable: true },
        { field: 'City', filter: 'agTextColumnFilter', sortable: true },
        { 
            field: 'Hire Date', 
            filter: 'agDateColumnFilter', 
            sortable: true, 
            filterParams: { comparator: dateComparator },
            valueGetter: params => moment(params.data['Hire Date'], 'MM/DD/YYYY').toDate(),
            valueFormatter: params => moment(params.value).format('MM/DD/YYYY')
        },
        { 
            field: 'Exit Date', 
            filter: 'agDateColumnFilter', 
            sortable: true, 
            filterParams: { comparator: dateComparator },
            valueGetter: params => moment(params.data['Exit Date'], 'MM/DD/YYYY').toDate(),
            valueFormatter: params => moment(params.value).format('MM/DD/YYYY')
        }
    ];

    useEffect(() => {
        fetch('https://aggrid-backend-git-main-kanishk-goels-projects.vercel.app/getTable')
            .then(response => response.json())
            .then(data => {
                const typedData = data.map(item => ({
                    ...item,
                    Age: parseFloat(item.Age),
                    'Annual Salary': parseSalary(item['Annual Salary']),
                    'Bonus %': parseBonus(item['Bonus %']),
                    'Hire Date': new Date(item['Hire Date']).toLocaleDateString('en-US'),
                    'Exit Date': new Date(item['Exit Date']).toLocaleDateString('en-US'),
                }));
                setRowData(typedData);
            })
            .catch(error => console.error('Error loading the data:', error));
    }, []);

    const onGridReady = (params) => {
        setGridApiState(params.api);
        setGridApi(params.api);
        const savedFilters = JSON.parse(sessionStorage.getItem('gridFilters'));
        if (savedFilters) {
            params.api.setFilterModel(savedFilters);
        }
    };
    

    return (
        <div className="ag-theme-alpine" style={{ height: 600, width: '100%' }}>
            <AgGridReact
                rowData={rowData}
                columnDefs={columnDefs}
                defaultColDef={{
                    resizable: true,
                    sortable: true,
                    filter: true // Enable filtering by default for all columns
                }}
                animateRows={true}
                pagination={true}
                paginationPageSize={20}
                sideBar={{ toolPanels: ['columns', 'filters'], defaultToolPanel: 'filters' }}
                onGridReady={onGridReady}
            />
        </div>
    );
};

export default MyAgGrid;
