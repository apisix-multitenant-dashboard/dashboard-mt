


    export async function fetchMonitoringSummary() {
    const response = await fetch('http://localhost:9000/admin/monitoring/summary', {
        headers: {
        Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
    });
    if (!response.ok) throw new Error('Failed to fetch monitoring summary');
    return response.json();
    }