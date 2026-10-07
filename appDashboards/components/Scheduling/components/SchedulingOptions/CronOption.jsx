import React, { useState } from 'react';

export default function CronOption() {
    const [cronExpression, setCronExpression] = useState('');

    const handleChange = (e) => {
        setCronExpression(e.target.value);
    };

    return (
        <div className="cron-option">
            <h3>Cron Expression</h3>
            <input
                type="text"
                value={cronExpression}
                onChange={handleChange}
                placeholder="Enter cron expression"
            />
            <p>Current: {cronExpression}</p>
        </div>
    );
}