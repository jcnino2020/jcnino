/* ============================================================
   config.js — API endpoints & mock data
   ============================================================ */

// API endpoint — adjust path to match your host
const TRUCKS_API = 'http://ov3.238.mytemp.website/pasabaybcd/api/trucks.php';

// Current fleet sort preference
let fleetSort = 'Rating';

// ── Mock Data ──────────────────────────────────────────────
const mockData = {
    stats: {
        users: 142,
        pendingBookings: 24,
        revenue: 12500.00
    },

    recentBookings: [
        { id: 'BKG-001', sender: 'Juan Dela Cruz',  receiver: 'Pedro Santos',  destination: 'Silay City',     cargo: 'Electronics',    date: 'Mar 10', status: 'In Transit' },
        { id: 'BKG-002', sender: 'Maria Santos',    receiver: 'Rosa Cruz',     destination: 'Talisay City',   cargo: 'Furniture',      date: 'Mar 10', status: 'Pending'    },
        { id: 'BKG-003', sender: 'Carlos Reyes',    receiver: 'Tony Flores',   destination: 'Bago City',      cargo: 'Appliances',     date: 'Mar 9',  status: 'Delivered'  },
        { id: 'BKG-004', sender: 'Ana Lopez',       receiver: 'Clara Dizon',   destination: 'Victorias City', cargo: 'Dry Goods',      date: 'Mar 9',  status: 'In Transit' }
    ],

    allBookings: [
        { id: 'BKG-001', sender: 'Juan Dela Cruz',  receiver: 'Pedro Santos',  destination: 'Silay City',     cargo: 'Electronics',    date: 'Mar 10', status: 'In Transit' },
        { id: 'BKG-002', sender: 'Maria Santos',    receiver: 'Rosa Cruz',     destination: 'Talisay City',   cargo: 'Furniture',      date: 'Mar 10', status: 'Pending'    },
        { id: 'BKG-003', sender: 'Carlos Reyes',    receiver: 'Tony Flores',   destination: 'Bago City',      cargo: 'Appliances',     date: 'Mar 9',  status: 'Delivered'  },
        { id: 'BKG-004', sender: 'Ana Lopez',       receiver: 'Clara Dizon',   destination: 'Victorias City', cargo: 'Dry Goods',      date: 'Mar 9',  status: 'In Transit' },
        { id: 'BKG-005', sender: 'Luis Tan',        receiver: 'Nene Baluyot',  destination: 'Murcia',         cargo: 'Rice Sacks',     date: 'Mar 9',  status: 'Pending'    },
        { id: 'BKG-006', sender: 'Grace Lim',       receiver: 'Danny Ong',     destination: 'Kabankalan',     cargo: 'Spare Parts',    date: 'Mar 8',  status: 'Delivered'  },
        { id: 'BKG-007', sender: 'Rene Valdez',     receiver: 'Isabel Go',     destination: 'Himamaylan',     cargo: 'Clothing',       date: 'Mar 8',  status: 'Pending'    },
        { id: 'BKG-008', sender: 'Luisa Gomez',     receiver: 'Mark Chua',     destination: 'Cadiz City',     cargo: 'Office Supplies', date: 'Mar 8', status: 'Cancelled'  }
    ],

    kycUsers: [
        { name: 'Roberto Aquino',  email: 'roberto.a@email.com', docType: 'PhilSys ID',        submitted: 'Mar 10, 2026', status: 'Pending'  },
        { name: 'Maricel Torres',  email: 'maricel.t@email.com', docType: "Driver's License",  submitted: 'Mar 10, 2026', status: 'Pending'  },
        { name: 'Dennis Garcia',   email: 'dennis.g@email.com',  docType: 'Passport',          submitted: 'Mar 9, 2026',  status: 'Verified' },
        { name: 'Liza Ramos',      email: 'liza.r@email.com',    docType: 'PhilSys ID',        submitted: 'Mar 9, 2026',  status: 'Pending'  },
        { name: 'Mark Santiago',   email: 'mark.s@email.com',    docType: 'UMID Card',         submitted: 'Mar 8, 2026',  status: 'Verified' },
        { name: 'Rina Castillo',   email: 'rina.c@email.com',    docType: "Voter's ID",        submitted: 'Mar 8, 2026',  status: 'Rejected' },
        { name: 'Joel Bautista',   email: 'joel.b@email.com',    docType: 'PhilSys ID',        submitted: 'Mar 7, 2026',  status: 'Pending'  }
    ]
};
