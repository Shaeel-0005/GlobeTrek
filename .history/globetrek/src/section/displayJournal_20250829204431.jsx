import React from "react";
import { supabase } from "../supabase";
import { useEffect } from "react";
import { useParams } from "react-router-dom";

const DisplayJournal = () =>{
const { id } = useParams();

    useEffect(()=>{
        const fetchSelectedJournal = async()=>{

            
        };
    }

    )

   

const [journal, setJournal] = useState(null);
    return(
        <h1>nothing</h1>
    )

}
export default DisplayJournal;