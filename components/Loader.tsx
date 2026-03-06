import { Loader2 } from "lucide-react";

const Loader = () => {
  return (
    <div className="flex justify-center items-center h-screen w-full">
      <Loader2 className="animate-spin text-white w-10 h-10" />
    </div>
  );
};

export default Loader;
