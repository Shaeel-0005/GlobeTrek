import React from "react";
import { supabase } from "../supabase";
import { useEffect } from "react";

const DisplayJournal = () =>{

    useEffect(()=>{
        const fetchSelectedJournal = async()=>{

            try{
                const { data: { user } } = await supabase.auth.getUser();
                if(!user) throw new Error("No user logged in");

                const { data: journals, error } = await supabase
                    .from('journals')
                    .select('*')
                    .eq('user_id', user.id);

                if(error) throw error;

                console.log("Journals:", journals);
            }
            catch(error){
                console.error("Error fetching journals:", error.message);
            }
        };
    }

    )


    return(
        <h1>nothing</h1>
    )

}
export default DisplayJournal;