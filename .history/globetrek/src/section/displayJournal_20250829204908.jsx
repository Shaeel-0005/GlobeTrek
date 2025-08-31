import React from "react";
import { supabase } from "../supabase";
import { useEffect } from "react";
import { useParams } from "react-router-dom";

const DisplayJournal = () =>{
const { id } = useParams();
const [journal, setJournal] = useState(null);

  useEffect(() => {
  const fetchSelectedJournal = async () => {
    // do your supabase query with `id`
  };
  fetchSelectedJournal(); // <--- don’t forget this
}, [id]);

useEffect(
    () => {
        const fetchjournal = async () =>{
            const {data,error} = await supabase
            .from('journals')
            .select('*')
            .eq('id',id)
            .single();
            if(error){
                console.log("Error fetching journal:",error);
        }
    }:
    fetchjournal();
    },[id]
)
   


    return(
        <h1>nothing</h1>
    )

}
export default DisplayJournal;