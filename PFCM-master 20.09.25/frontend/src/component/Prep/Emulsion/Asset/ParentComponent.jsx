import React, { useState, useEffect, useCallback, useRef } from 'react';
import TableMainPrep from './table';
import Modal1 from './Modal1';
import Modal2 from './Modal2';
import Modal3 from './Modal3';
import Modal4 from './Modal4';
import ModalEditPD from './ModalEditPD';
import ModalSuccess from './ModalSuccess';
import ModalDelete from './ModalDelete';
import axios from "axios";
axios.defaults.withCredentials = true;
import io from 'socket.io-client';
import CameraActivationModal from "./ModalScanSAP";
import DataReviewSAP from "./ModalConfirmSAP";
import { IoBarcodeSharp } from "react-icons/io5";

const API_URL = import.meta.env.VITE_API_URL;

const ParentComponent = () => {
  const [openModal1, setOpenModal1] = useState(false);
  const [openModal2, setOpenModal2] = useState(false);
  const [openModal3, setOpenModal3] = useState(false);
  const [openModal4, setOpenModal4] = useState(false);
  const [openEditModal, setOpenEditModal] = useState(false);
  const [openDeleteModal, setOpenDeleteModal] = useState(false);
  const [openSuccessModal, setOpenSuccessModal] = useState(false);
  const [dataForModal1, setDataForModal1] = useState(null);
  const [dataForModal2, setDataForModal2] = useState(null);
  const [dataForModal3, setDataForModal3] = useState(null);
  const [dataForModal4, setDataForModal4] = useState(null);
  const [dataForEditModal, setDataForEditModal] = useState(null);
  const [dataForSuccessModal, setDataForSuccessModal] = useState(null);
  const [dataForDeleteModal, setDataForDeleteModal] = useState(null);
  const [tableData, setTableData] = useState([]);
  const [isFetching, setIsFetching] = useState(false);

  const [openCameraModal, setOpenCameraModal] = useState(false);
  const [primaryBatch, setPrimaryBatch] = useState(""); // เก็บ Material
  const [secondaryBatch, setSecondaryBatch] = useState(""); // เก็บ Batch
  const [openDataReview, setOpenDataReview] = useState(false);
  const [selectedMaterials, setSelectedMaterials] = useState([]);

  const [material, setMaterial] = useState("");
  const [materialName, setMaterialName] = useState("");
  const [batch, setBatch] = useState("");
  const [selectedPlans, setSelectedPlans] = useState([]);
  const [selectedgroup, setSelectedGroup] = useState([]);
  const [deliveryLocation, setDeliveryLocation] = useState("");
  const [operator, setOperator] = useState("");
  const [weighttotal, setWeightTotal] = useState("");

  const fetchTimeoutRef = useRef(null);
  const socketRef = useRef(null);
  const rmTypeIds = JSON.parse(localStorage.getItem('rm_type_id')) || [];


  const formatDateTime = (dateString) => {
    if (!dateString || dateString === "แสดงข้อมูล") {
      return dateString || "ไม่มีข้อมูล";
    }

    // ถ้าวันที่อยู่ในรูปแบบ "DD/MM/YYYY HH:MM"
    if (typeof dateString === 'string' && dateString.match(/\d{2}\/\d{2}\/\d{4} \d{2}:\d{2}/)) {
      const [datePart, timePart] = dateString.split(' ');
      const [day, month, year] = datePart.split('/');

      // แสดงปีเป็น ค.ศ. โดยไม่ต้องแปลง
      return `${day}/${month}/${year} ${timePart}`;
    }

    // ถ้าวันที่อยู่ในรูปแบบอื่นที่ JavaScript สามารถ parse ได้
    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
      console.warn("Invalid date format:", dateString);
      return dateString;
    }

    // แสดงผลในรูปแบบ DD/MM/YYYY HH:MM (ค.ศ.)
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');

    return `${day}/${month}/${year} ${hours}:${minutes}`;
  };

  // Function to fetch data from API
  const fetchData = useCallback(async () => {
    setIsFetching(true);
    try {
      const response = await axios.get(`${API_URL}/api/prep/getRMForEmuList`, {
        params: {
          rm_type_ids: rmTypeIds.join(',') // ส่งเป็น string คั่นด้วย comma
        }
      });

      const data = response.data;

      // รองรับทั้ง array ตรง ๆ หรือ object { success, data }
      const rawData = Array.isArray(data) ? data : (data.success ? data.data : []);

      const processedData = rawData.map(item => ({
        ...item,
      }));

      setTableData(processedData);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setIsFetching(false);
    }
  }, [rmTypeIds]);


  // Debounced fetchData
  const fetchDataDebounced = useCallback(() => {
    if (fetchTimeoutRef.current) {
      clearTimeout(fetchTimeoutRef.current);
    }
    fetchTimeoutRef.current = setTimeout(() => {
      fetchData();
    }, 300);
  }, [fetchData]);


  useEffect(() => {
    const newSocket = io(API_URL, {
      transports: ["websocket"],
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      autoConnect: true,
    });
    socketRef.current = newSocket;

    newSocket.emit('joinRoom', 'saveRMForProdRoom');

    const handleDataUpdate = () => {
      if (!isFetching) {
        fetchDataDebounced();
      }
    };

    newSocket.on('dataUpdated', handleDataUpdate);
    newSocket.on('dataDelete', handleDataUpdate);
    newSocket.on('rawMaterialSaved', handleDataUpdate);

    fetchData(); // ✅ initial fetch

    return () => {
      newSocket.off('dataUpdated');
      newSocket.off('dataDelete');
      newSocket.off('rawMaterialSaved');
      newSocket.disconnect();
      socketRef.current = null;
      if (fetchTimeoutRef.current) {
        clearTimeout(fetchTimeoutRef.current);
      }
    };
    // ✅ ให้รันครั้งเดียวตอน mount
  }, []);




  // Process data with formatted dates
  const processDataWithFormattedDates = (data) => {
    if (!data) return null;

    return {
      ...data,
      CookedDateTime: data.CookedDateTime ? formatDateTime(data.CookedDateTime) : null,
      withdraw_date: data.withdraw_date ? formatDateTime(data.withdraw_date) : null
    };
  };

  const clearData = () => {
    setDataForModal1(null);
    setDataForModal2(null);
    setDataForModal3(null);
  };

  const handleOpenModal1 = (data) => {
    if (!data) {
      console.error("Data for Modal1 is null");
      return;
    }

    const formattedData = {
      ...data,
      rm_type_id: data.rm_type_id,
      mat: data.mat,
      mat_name: data.mat_name,
      CookedDateTime: data.CookedDateTime,
      withdraw_date: data.withdraw_date,
      production: data.production, // ส่งค่า production ไปด้วย
      level_eu: data.level_eu
    };

    setDataForModal1(formattedData);
    setOpenModal1(true);
  };

  const handleOpenModal2 = (data) => {
    if (!data || !dataForModal1) {
      console.error("Data for Modal2 is null or missing required fields");
      return;
    }

    const formattedData = {
      ...data,
      batch: data.batch,
      rmfp_id: dataForModal1.rmfp_id,
      CookedDateTime: dataForModal1.CookedDateTime,
      dest: dataForModal1.dest,
      rm_type_id: dataForModal1.rm_type_id,
      mat: dataForModal1.mat,
      mat_name: dataForModal1.mat_name,
      withdraw_date: dataForModal1.withdraw_date,
      production: dataForModal1.production, // ส่งค่า production ไปด้วย
      level_eu: dataForModal1.level_eu
    };

    setDataForModal2(formattedData);
    setOpenModal2(true);
    setOpenModal1(false);
  };

  const handleOpenModal3 = (data) => {
    if (!data) {
      console.error("Data for Modal3 is null");
      return;
    }

    if (!data.CookedDateTime) {
      console.warn("CookedDateTime is missing in data for Modal3");
    }

    const formattedData = {
      ...data,
      CookedDateTime: data.CookedDateTime,
      mat: dataForModal2?.mat || data.mat,
      mat_name: dataForModal2?.mat_name || data.mat_name,
      withdraw_date: dataForModal2?.withdraw_date || data.withdraw_date,
      production: dataForModal2?.production || data.production, // ส่งค่า production ไปด้วย
      level_eu: dataForModal2?.level_eu || data.level_eu
    };

    setDataForModal3(formattedData);
    setOpenModal3(true);
    setOpenModal2(false);
  };

  const handleOpenEditModal = (data) => {
    if (!data) {
      console.error("Data for EditModal is null");
      return;
    }

    const formattedData = {

      sap_re_id: data.sap_re_id,
      batch: data.batch,
      material: data.mat,
      withdraw_date: data.withdraw_date,

    };


    setDataForEditModal(formattedData);
    setOpenEditModal(true);
  };


  const handleOpenModal4 = () => {
    setOpenModal4(true);
  };




const handleOpenDeleteModal = (data) => {
  if (!data) {
    console.error("Data for DeleteModal is null");
    return;
  }

  const formattedData = {
    batch: data.batch,
    mat: data.mat,
    mat_name: data.mat_name,
    production: data.production,
    rmfemu_id: data.rmfemu_id,
    withdraw_date: data.withdraw_date,
    level_eu: data.level_eu
  };

  console.log("DeleteModal data:", formattedData); // ✅ ตรวจสอบข้อมูล

  // อัปเดต state ก่อน แล้วเปิด modal ใน next tick
  setDataForDeleteModal(formattedData);
  setTimeout(() => setOpenDeleteModal(true), 0);
};



  const handleOpenSuccess = (data) => {
    if (!data) {
      console.error("Data for SuccessModal is null");
      return;
    }

    const formattedData = {
      batch: data.batch,
      mat: data.mat,
      mat_name: data.mat_name,
      production: data.production,
      rmfp_id: data.rmfp_id,
      level_eu: data.level_eu,
      newBatch: data.newBatch,
      withdraw_date: data.withdraw_date
    };

    setDataForSuccessModal(formattedData);
    setOpenSuccessModal(true);
  };

  const handleEditSuccess = async (updatedData) => {
    setOpenEditModal(false);
    if (!updatedData) {
      console.error("Updated data is null");
      return;
    }

    try {
      await fetchData();
    } catch (error) {
      console.error("Error updating data:", error);
    }
  };

const handleConfirmCameraModal = ({ primaryBatch, secondaryBatch, weightTotal, selectedMaterials }) => {
  setPrimaryBatch(primaryBatch);
  setSecondaryBatch(secondaryBatch);
  setWeightTotal(weightTotal);
  setSelectedMaterials(selectedMaterials);

  // ส่งค่าตรง ๆ ให้ DataReviewSAP แทนรอ state update
  setOpenDataReview({
    material: primaryBatch,
    batch: secondaryBatch,
    emulsionweightTotal: weightTotal,
    selectedMaterials
  });

  setOpenCameraModal(false);
};



  const handleCloseDataReview = () => {
    setOpenDataReview(false);
  };

  const resetData = () => {
    setPrimaryBatch("");
    setSecondaryBatch("");
    setMaterial("");
    setMaterialName("");
    setBatch("");
    setSelectedPlans([]);
    setSelectedGroup([]);
    setDeliveryLocation("");
    setOperator("");
    setWeightTotal("");
    setOpenCameraModal(true);
  };

  return (
    <div>
      <TableMainPrep
        handleOpenModal={handleOpenModal1}
        handleOpenEditModal={handleOpenEditModal}
        handleOpenModal4={handleOpenModal4}
        handleOpenDeleteModal={handleOpenDeleteModal}
        handleOpenSuccess={handleOpenSuccess}
        handleopenModal1={handleOpenModal1}
        data={tableData}
      />

      <CameraActivationModal
        open={openCameraModal}
        onClose={() => setOpenCameraModal(false)}
        onConfirm={handleConfirmCameraModal} // ส่งข้อมูลไปยัง parent เมื่อยืนยัน
        primaryBatch={primaryBatch} // ส่งข้อมูล Material
        secondaryBatch={secondaryBatch} // ส่งข้อมูล Batch
        setPrimaryBatch={setPrimaryBatch} // ให้สามารถตั้งค่า primaryBatch
        setSecondaryBatch={setSecondaryBatch} // ให้สามารถตั้งค่า secondaryBatch
        selectedMaterials={selectedMaterials}   // <-- ส่งจาก state
        weightTotal={weighttotal}               // <-- ส่งจาก state
      />


{console.log("DataReviewSAP prop parentcomponent:", {
  material: primaryBatch,
  batch: secondaryBatch,
  emulsionweightTotal: weighttotal,
  selectedMaterials: selectedMaterials,
})}
     {/* <DataReviewSAP
  open={openDataReview}
  onClose={handleCloseDataReview}
  material={primaryBatch}           // Raw Material
  batch={secondaryBatch}            // Batch
  emulsionweightTotal={weighttotal}         // น้ำหนักรวม
  selectedMaterials={selectedMaterials} // รายการวัตถุดิบ
/> */}

<DataReviewSAP
  open={!!openDataReview}
  onClose={handleCloseDataReview}
  {...openDataReview} // spread ข้อมูลตรงจาก state
/>


      {dataForModal1 && (
        <Modal1
          open={openModal1}
          onClose={() => setOpenModal1(false)}
          onNext={handleOpenModal2}
          data={dataForModal1}
          mat={dataForModal1.mat}
          mat_name={dataForModal1.mat_name}
          batch={dataForModal1.batch}
          production={dataForModal1.production}
          rmfp_id={dataForModal1.rmfp_id}
          CookedDateTime={dataForModal1.CookedDateTime}
          dest={dataForModal1.dest}
          rm_type_id={dataForModal1.rm_type_id}
          withdraw_date={dataForModal1.withdraw_date}
          level_eu={dataForModal1.level_eu}
        />
      )}

      {dataForModal2 && (
        <Modal2
          open={openModal2}
          rmfp_id={dataForModal2.rmfp_id}
          CookedDateTime={dataForModal2.CookedDateTime}
          dest={dataForModal2.dest}
          batch={dataForModal2.batch}
          batch_before={dataForModal2.batch_before}
          rm_type_id={dataForModal2.rm_type_id}
          mat_name={dataForModal2.mat_name}
          withdraw_date={dataForModal2.withdraw_date}
          production={dataForModal2.production} // ส่งค่า production ไปด้วย
          level_eu={dataForModal2.level_eu}
          onClose={() => {
            setOpenModal2(false);
            clearData();
          }}
          onNext={handleOpenModal3}
          data={dataForModal2}
          clearData={clearData}
        />
      )}

      {dataForModal3 && (
        <Modal3
          open={openModal3}
          CookedDateTime={dataForModal3.CookedDateTime}
          onClose={() => {
            setOpenModal3(false);
            clearData();
          }}
          data={dataForModal3}
          mat_name={dataForModal3.mat_name}
          mat={dataForModal3.mat} // ส่งค่า mat ไปด้วย
          withdraw_date={dataForModal3.withdraw_date}
          production={dataForModal3.production}
          level_eu={dataForModal3.level_eu}
          onEdit={() => {
            setOpenModal2(true);
            setOpenModal3(false);
          }}
          clearData={clearData}
        />
      )}

      {openModal4 && (
        <Modal4
          open={openModal4}
          onClose={(dataFromModal4) => {
            // dataFromModal4 = { selectedMaterials, totalWeight }
            if (dataFromModal4 && dataFromModal4.selectedMaterials.length > 0) {
              console.log("Received from Modal4:", dataFromModal4);

              // ส่ง selectedMaterials และ totalWeight ตรง ๆ ไป CameraActivationModal
              setSelectedMaterials(dataFromModal4.selectedMaterials); // <-- เก็บเป็น array ของ object ตรง ๆ
              setWeightTotal(dataFromModal4.totalWeight || 0);
            }

            setOpenModal4(false);
            setDataForModal4(null);

            // เปิด CameraActivationModal
            setOpenCameraModal(true);
          }}
          onSuccess={fetchData}
        />

      )}

      {dataForEditModal && (
        <ModalEditPD
          open={openEditModal}
          onClose={() => setOpenEditModal(false)}
          data={dataForEditModal}
          material={dataForEditModal.material}
          batch={dataForEditModal.batch}
          sap_re_id={dataForEditModal.sap_re_id}
          withdraw_date={dataForEditModal.withdraw_date}
          onSuccess={handleEditSuccess}
        />
      )}



      {dataForSuccessModal && (
        <ModalSuccess
          open={openSuccessModal}
          onClose={() => setOpenSuccessModal(false)}
          mat={dataForSuccessModal.mat}
          mat_name={dataForSuccessModal.mat_name}
          batch={dataForSuccessModal.batch}
          production={dataForSuccessModal.production}
          rmfp_id={dataForSuccessModal.rmfp_id}
          selectedPlans={dataForSuccessModal.selectedPlans}
          level_eu={dataForSuccessModal.level_eu}
          newBatch={dataForSuccessModal.newBatch}
          withdraw_date={dataForSuccessModal.withdraw_date}
          onSuccess={fetchData}
        />
      )}

 {dataForDeleteModal && (
        <ModalDelete
          open={openDeleteModal}
          onClose={() => setOpenDeleteModal(false)}
          mat={dataForDeleteModal.mat}
          mat_name={dataForDeleteModal.mat_name}
          batch={dataForDeleteModal.batch}
          production={dataForDeleteModal.production}
          rmfemu_id={dataForDeleteModal.rmfemu_id}
          selectedPlans={dataForDeleteModal.selectedPlans}
          withdraw_date={dataForDeleteModal.withdraw_date}
          onSuccess={fetchData}
        />
      )}
    </div>
  );
};

export default React.memo(ParentComponent);