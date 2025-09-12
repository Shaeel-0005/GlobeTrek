import React from "react";
import { supabase } from "../supabase";
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";

const DisplayJournal = () => {
  const { id } = useParams();
  const [journal, setJournal] = useState(null);

  useEffect(() => {
    const fetchJournal = async () => {
      const { data, error } = await supabase
        .from("journals")
        .select("*")
        .eq("id", id)
        .single();

      if (error) {
        console.log("Error fetching journal:", error);
      } else {
        setJournal(data); // <-- save the result
      }
    };

    fetchJournal();
  }, [id]);

  return (
    <div>
      {journal ? (
        <pre>
 
        <div className="section align-center flex flex-col p-8">
            <h2 className="text-3xl font-bold mb-4">{journal.title}</h2>
            <p className="mb-4">{journal.location}</p>
            <p className="text-sm text-gray-500">
                Created at: {new Date(journal.created_at).toLocaleString()}
            </p>


        </div>

        </pre>
      ) : (
        <p>Loading...</p>
      )}
    </div>
  );
};
export default DisplayJournal;
