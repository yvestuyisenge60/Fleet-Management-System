import React, { useEffect, useState } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  LineChart, Line, CartesianGrid, Legend
} from 'recharts';
import api from '../api';
import PageHeader from '../components/PageHeader';
import Table from '../components/Table';
import './page.css';
import './Reports.css';

const TABS = ['Vehicle Utilization', 'Fuel Consumption', 'Maintenance Costs', 'Driver Performance'];

export default function Reports() {
  const [tab, setTab] = useState(0);
  const [vehicleUtil, setVehicleUtil] = useState([]);
  const [fuelData, setFuelData]       = useState([]);
  const [maintData, setMaintData]     = useState([]);
  const [driverData, setDriverData]   = useState([]);

  useEffect(() => {
    api.get('/reports/vehicle-utilization').then((r) => setVehicleUtil(r.data)).catch(() => {});
    api.get('/reports/fuel-consumption').then((r)    => setFuelData(r.data)).catch(() => {});
    api.get('/reports/maintenance-costs').then((r)   => setMaintData(r.data)).catch(() => {});
    api.get('/reports/driver-performance').then((r)  => setDriverData(r.data)).catch(() => {});
  }, []);

  const vehicleCols = [
    { key: 'PlateNumber',   label: 'Plate #' },
    { key: 'Model',         label: 'Model' },
    { key: 'Status',        label: 'Status' },
    { key: 'TripCount',     label: 'Trips' },
    { key: 'TotalDistance', label: 'Total Distance (km)', render: (r) => parseFloat(r.TotalDistance).toFixed(1) },
    { key: 'Mileage',       label: 'Mileage (km)', render: (r) => r.Mileage.toLocaleString() },
  ];

  const fuelCols = [
    { key: 'PlateNumber',  label: 'Plate #' },
    { key: 'Model',        label: 'Model' },
    { key: 'FuelEntries',  label: 'Fuel Entries' },
    { key: 'TotalLiters',  label: 'Total Liters', render: (r) => parseFloat(r.TotalLiters).toFixed(1) },
    { key: 'TotalCost',    label: 'Total Cost ($)', render: (r) => `$${parseFloat(r.TotalCost).toFixed(2)}` },
  ];

  const maintCols = [
    { key: 'PlateNumber',  label: 'Plate #' },
    { key: 'Model',        label: 'Model' },
    { key: 'ServiceCount', label: 'Services' },
    { key: 'TotalCost',    label: 'Total Cost ($)', render: (r) => `$${parseFloat(r.TotalCost).toFixed(2)}` },
  ];

  const driverCols = [
    { key: 'FullName',       label: 'Driver Name' },
    { key: 'LicenseNumber',  label: 'License #' },
    { key: 'TripCount',      label: 'Trips' },
    { key: 'TotalDistance',  label: 'Distance (km)', render: (r) => parseFloat(r.TotalDistance).toFixed(1) },
    { key: 'TotalFuelCost',  label: 'Fuel Cost ($)', render: (r) => `$${parseFloat(r.TotalFuelCost).toFixed(2)}` },
  ];

  return (
    <div>
      <PageHeader icon="📈" title="Reports" subtitle="Operational and management reports" />

      {/* Tabs */}
      <div className="report-tabs">
        {TABS.map((t, i) => (
          <button key={i} className={`report-tab ${tab === i ? 'active' : ''}`} onClick={() => setTab(i)}>{t}</button>
        ))}
      </div>

      {/* Vehicle Utilization */}
      {tab === 0 && (
        <div>
          <div className="page-card">
            <h3 className="report-section-title">Vehicle Utilization Report</h3>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={vehicleUtil} margin={{ left: -10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="PlateNumber" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Legend />
                <Bar dataKey="TripCount" fill="#3b82f6" name="Trips" radius={[4,4,0,0]} />
                <Bar dataKey="TotalDistance" fill="#10b981" name="Distance (km)" radius={[4,4,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="page-card">
            <Table columns={vehicleCols} data={vehicleUtil} emptyMsg="No data." />
          </div>
        </div>
      )}

      {/* Fuel Consumption */}
      {tab === 1 && (
        <div>
          <div className="page-card">
            <h3 className="report-section-title">Fuel Consumption Report</h3>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={fuelData} margin={{ left: -10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="PlateNumber" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Legend />
                <Bar dataKey="TotalLiters" fill="#f59e0b" name="Liters" radius={[4,4,0,0]} />
                <Bar dataKey="TotalCost" fill="#ef4444" name="Cost ($)" radius={[4,4,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="page-card">
            <Table columns={fuelCols} data={fuelData} emptyMsg="No data." />
          </div>
        </div>
      )}

      {/* Maintenance Costs */}
      {tab === 2 && (
        <div>
          <div className="page-card">
            <h3 className="report-section-title">Maintenance Costs Report</h3>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={maintData} margin={{ left: -10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="PlateNumber" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Legend />
                <Bar dataKey="ServiceCount" fill="#8b5cf6" name="Services" radius={[4,4,0,0]} />
                <Bar dataKey="TotalCost" fill="#ef4444" name="Cost ($)" radius={[4,4,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="page-card">
            <Table columns={maintCols} data={maintData} emptyMsg="No data." />
          </div>
        </div>
      )}

      {/* Driver Performance */}
      {tab === 3 && (
        <div>
          <div className="page-card">
            <h3 className="report-section-title">Driver Performance Report</h3>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={driverData} margin={{ left: -10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="FullName" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Legend />
                <Bar dataKey="TripCount"     fill="#06b6d4" name="Trips" radius={[4,4,0,0]} />
                <Bar dataKey="TotalDistance" fill="#10b981" name="Distance (km)" radius={[4,4,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="page-card">
            <Table columns={driverCols} data={driverData} emptyMsg="No data." />
          </div>
        </div>
      )}
    </div>
  );
}
