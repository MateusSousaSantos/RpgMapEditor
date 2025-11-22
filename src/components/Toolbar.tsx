import { FaPaintBrush } from "react-icons/fa";
import { useTool } from "../contexts/ToolContext";

export const Toolbar: React.FC = () => {
  const { setCurrentTool, isToolActive } = useTool();

  const Draw = () => {
    const isActive = isToolActive('draw');
    return (
      <button 
        onClick={() => setCurrentTool(isActive ? null : 'draw')}
        className={`p-2 rounded transition-colors ${
          isActive 
            ? 'bg-white text-black' 
            : 'hover:bg-white group'
        }`}
      >
        <FaPaintBrush 
          size={24} 
          className={
            isActive 
              ? 'text-black' 
              : 'text-white group-hover:text-black'
          } 
        />
      </button>
    );
  };
  

  // const Select = () => {
  //   const isActive = isToolActive('select');
  //   return (
  //     <button 
  //       onClick={() => setCurrentTool(isActive ? null : 'select')}
  //       className={`p-2 rounded transition-colors ${
  //         isActive 
  //           ? 'bg-white text-black' 
  //           : 'hover:bg-white group'
  //       }`}
  //     >
  //       <FaMousePointer 
  //         size={24} 
  //         className={
  //           isActive 
  //             ? 'text-black' 
  //             : 'text-white group-hover:text-black'
  //         } 
  //       />
  //     </button>
  //   );
  // };

  // const Erase = () => {
  //   const isActive = isToolActive('erase');
  //   return (
  //     <button 
  //       onClick={() => setCurrentTool(isActive ? null : 'erase')}
  //       className={`p-2 rounded transition-colors ${
  //         isActive 
  //           ? 'bg-white text-black' 
  //           : 'hover:bg-white group'
  //       }`}
  //     >
  //       <FaEraser 
  //         size={24} 
  //         className={
  //           isActive 
  //             ? 'text-black' 
  //             : 'text-white group-hover:text-black'
  //         } 
  //       />
  //     </button>
  //   );
  // };

  return (
    <div className="absolute bottom-10 left-1/2 transform -translate-x-1/2 bg-slate-800 w-120 h-15 rounded-full drop-shadow-2xl border-2 border-slate-500 flex items-center justify-center gap-2">
      {/* <Select /> */}
      <Draw />
      {/* <Erase /> */}
    </div>
  );
};
