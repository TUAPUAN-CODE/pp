import { Route, Routes } from "react-router-dom";

import Sidebar from "./SidebarOven.jsx";

import OverviewPage from "./Main/MainPage.jsx";
import ProductsPage from "./ScanSAP/ScanSAPPage.jsx";

import SalesPage from "./MatCold/MatColdPage.jsx";
import HistoryBakingPrep from "./HistoryBaking/HistoryBakingPage.jsx";
import WorkplaceSelector from "../User/WorkplaceSelector.jsx";

const API_URL = import.meta.env.VITE_API_URL;

function AppColdStorages() {
	return (
		<div className='flex h-screen bg-gray-900 text-gray-100 overflow-hidden'>
			{/* BG */}
			<div className='fixed inset-0 z-0'>
				<div className='absolute inset-0 bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 opacity-80' />
				<div className='absolute inset-0 backdrop-blur-sm' />
			</div>

			<Sidebar />
			<Routes>
				<Route path='/' element={<OverviewPage />} />
				<Route path='/products' element={<ProductsPage />} />
				<Route path='/sales' element={<SalesPage />} />
				<Route path='/analytics' element={<HistoryBakingPrep />} />
				<Route path='/WorkplaceSelector' element={<WorkplaceSelector />} />
			</Routes>
		</div>
	);
}

export default AppColdStorages;
