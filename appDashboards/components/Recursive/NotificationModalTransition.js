/* 
Name: NotificationModalTransition
Action: Modal of the alerts of all the ReactPj
*/

import { useState, useEffect } from 'react';


function NotificationModalTransition({ message, position, status, activate, setActivate, width }) {
    const [opacityIntern, setOpacity] = useState(1)
    const styleDiv = {
        backgroundColor: status ? "#1EB352" : "#A70000",
        width: width,
        borderRadius: "5%",
        color: "#FFF",
        position: "absolute",
        left: position.indexOf("left") !== -1 ? "5%" : "unset",
        right: position.indexOf("right") !== -1 ? "5%" : "unset",
        top: position.indexOf("top") !== -1 ? "5%" : "unset",
        bottom: position.indexOf("bottom") !== -1 ? "5%" : "unset",
        fontSize: "15px",
        minWidth: "200px",
        maxHeight: "200px",
        display: "none",
        flexDirection: "column",
        padding: "10px",
        opacity: "1",
        transition: "opacity 0.5s",
        width: "250px"
    }

    useEffect(() => {
        setTimeout(function () {
            setOpacity(0)
            setTimeout(function () {
                setActivate(false)
                setOpacity(1)
            }, 500)
        }, 3000)
    }, [activate])

    return (
        <div style={{ width: 0, height: 0 }} id="#NotificationModal">
            <div style={{ ...styleDiv, display: activate ? "flex" : "none", opacity: opacityIntern }} >
                <span style={{ display: "block", fontWeight: 700 }}>{status ? "Success" : "Error"}</span>
                <span>{message}</span>
            </div>
        </div>
    )
}

export default (NotificationModalTransition);