import React, { useState } from "react";
import SpreadsheetTable, { Row } from "./components/SpreadsheetTable";

const initialData: Row[] = [
  {
    id: "1",
    name: "Alice Johnson",
    email: "alice@example.com",
    status: "Active",
    role: "Admin",
    avatar: "https://randomuser.me/api/portraits/women/44.jpg",
  },
  {
    id: "2",
    name: "Bob Smith",
    email: "bob@example.com",
    status: "Invited",
    role: "Editor",
    avatar: "https://randomuser.me/api/portraits/men/45.jpg",
  },
  {
    id: "3",
    name: "Charlie Rose",
    email: "charlie@example.com",
    status: "Inactive",
    role: "Viewer",
    avatar: "https://randomuser.me/api/portraits/men/46.jpg",
  },
];

function App() {
  const [data, setData] = useState<Row[]>(initialData);

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <SpreadsheetTable data={data} setData={setData} />
    </div>
  );
}

export default App;
