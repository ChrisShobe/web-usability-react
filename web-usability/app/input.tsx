"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";


export default function Input() {
    
    const goBack = useCallback(() => {
		window.location.href = "/page";
	}, []);

    const recording = useCallback(() => {
		window.location.href = "/recording";
	}, []);

    const resetWords = useCallback(() => {
        const avoid1 = document.getElementById("avoid1") as HTMLInputElement | null;
        const avoid2 = document.getElementById("avoid2") as HTMLInputElement | null;
        const avoid3 = document.getElementById("avoid3") as HTMLInputElement | null;
        const avoid4 = document.getElementById("avoid4") as HTMLInputElement | null;
        const avoid5 = document.getElementById("avoid5") as HTMLInputElement | null;
        const include1 = document.getElementById("include1") as HTMLInputElement | null;
        const include2 = document.getElementById("include2") as HTMLInputElement | null;
        const include3 = document.getElementById("include3") as HTMLInputElement | null;
        const include4 = document.getElementById("include4") as HTMLInputElement | null;
        const include5 = document.getElementById("include5") as HTMLInputElement | null;

        if (avoid1) avoid1.value = "";
        if (avoid2) avoid2.value = "";
        if (avoid3) avoid3.value = "";
        if (avoid4) avoid4.value = "";
        if (avoid5) avoid5.value = "";
        if (include1) include1.value = "";
        if (include2) include2.value = "";
        if (include3) include3.value = "";
        if (include4) include4.value = "";
        if (include5) include5.value = "";
    }, []);

    const saveWords = useCallback(() => {
        const avoidWords: string[] = [
            (document.getElementById("avoid1") as HTMLInputElement).value,
            (document.getElementById("avoid2") as HTMLInputElement).value,
            (document.getElementById("avoid3") as HTMLInputElement).value,
            (document.getElementById("avoid4") as HTMLInputElement).value,
            (document.getElementById("avoid5") as HTMLInputElement).value
        ];

        const includeWords: string[] = [
            (document.getElementById("include1") as HTMLInputElement).value,
            (document.getElementById("include2") as HTMLInputElement).value,
            (document.getElementById("include3") as HTMLInputElement).value,
            (document.getElementById("include4") as HTMLInputElement).value,
            (document.getElementById("include5") as HTMLInputElement).value
        ];

        const avoidCount: number = avoidWords.filter(word => word.trim() !== "").length;
        const includeCount: number = includeWords.filter(word => word.trim() !== "").length;

        interface Words {
            avoid1: string;
            avoid2: string;
            avoid3: string;
            avoid4: string;
            avoid5: string;
            include1: string;
            include2: string;
            include3: string;
            include4: string;
            include5: string;
            avoidCount: number;
            includeCount: number;
        }

        const words: Words = {
            avoid1: avoidWords[0],
            avoid2: avoidWords[1],
            avoid3: avoidWords[2],
            avoid4: avoidWords[3],
            avoid5: avoidWords[4],
            include1: includeWords[0],
            include2: includeWords[1],
            include3: includeWords[2],
            include4: includeWords[3],
            include5: includeWords[4],
            avoidCount: avoidCount,
            includeCount: includeCount
        };

        localStorage.setItem("savedWords", JSON.stringify(words));
    }, []);

    
    
    return (
        <text>
            <button className="back-button" onClick={goBack}>
                ← Back
            </button>
            <h1>Setup</h1>
            <h3>Please enter the words that you would like to avoid using and the words you would like to use more.</h3>
        
            <div className="doble-gird">
                <div>
                    <h2>Words to avoid</h2>
                    <input id="avoid1"></input>
                    <input id="avoid2"></input>
                    <input id="avoid3"></input>
                    <input id="avoid4"></input>
                    <input id="avoid5"></input>
                </div>
                <div>
                    <h2>Words to include</h2>
                    <input id="include1"></input>
                    <input id="include2"></input>
                    <input id="include3"></input>
                    <input id="include4"></input>
                    <input id="include5"></input>
                </div>
            </div>
        
            <h3>Not all fields need to be filled in.</h3>
            <button onClick={resetWords}>Reset</button>
            <button onClick={recording}>Next</button>
        </text>
    );

}