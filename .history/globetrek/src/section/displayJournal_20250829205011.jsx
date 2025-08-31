import React from "react";
import { supabase } from "../supabase";
import { useEffect,useState} from "react";
import { useParams } from "react-router-dom";

const DisplayJournal = () =>{
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


    return(
        <h1>nothing</h1>
    )

}
export default DisplayJournal;