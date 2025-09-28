import { motion } from "framer-motion";
import { UserCheck, UserPlus, UsersIcon, UserX } from "lucide-react";
import Header from "../../Layout/Header";
import Buttom from "../../Layout/Buttom";
import React, { useState } from "react";
import CameraActivationModal from "./Asset/ModalScanSAP";
import ParentComponent from "./Asset/Parent";
import { AlertTriangle, DollarSign, Package, TrendingUp } from "lucide-react";

const ScanSAPPage = () => {
	return (
		<div style={{ backgroundColor: "#fff" }} className="flex-1 overflow-auto relative z-10">
		  <main className="max-w-8xl mx-auto py-1 px-1 lg:px-8">
		  <Header title="Scan SAP" />
	
				</main>
		   <main className="max-w-8xl  mx-auto py-1 px-1 lg:px-8 " style={{ height: '86vh' }}>
		   <CameraActivationModal />
		   <ParentComponent />
				</main>
				<main className="max-w-8xl mx-auto py-1 px-1 lg:px-8">
		  <Buttom title="Copyright © 2025 i-Tail Corporation Public Company Limited. All right reserved" />
	
				</main>
		</div>
	  );
};



export default ScanSAPPage;