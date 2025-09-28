import Header from "../../Layout/Header";
import Buttom from "../../Layout/Buttom";
import ParentComponent from "./Asset/ParentComponent";

const DelayTimeTrackingPage = () => {
  return (
    <div style={{ backgroundColor: "#f8fafc" }} className="flex-1 overflow-auto relative z-10">
      <main className="max-w-8xl mx-auto py-4 px-4 lg:px-8">
        <Header title="Delay Time Tracking" />
      </main>
      <main className="max-w-8xl mx-auto py-4 px-4 lg:px-8">
        <div className="bg-white rounded-lg shadow-md p-1">
          <ParentComponent />  
        </div>
      </main>
      <main className="max-w-8xl mx-auto py-4 px-4 lg:px-8">
        <Buttom title="Copyright © 2025 i-Tail Corporation Public Company Limited. All right reserved" />
      </main>
    </div>
  );
};

export default DelayTimeTrackingPage;