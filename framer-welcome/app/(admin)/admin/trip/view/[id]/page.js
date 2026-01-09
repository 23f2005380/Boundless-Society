import React from "react";
import { DataTable } from "@/components/data-table";
import data from "../../../data.json";
function page() {
  return (
    <div className="py-4">
      <DataTable data={data} />
    </div>
  );
}

export default page;
