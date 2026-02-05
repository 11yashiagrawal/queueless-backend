const getSlotAvailability = async (service, workingDay, date, appointments) => {
    const slotDuration = service.avgDurationMinutes + service.bufferMinutes;
    const startTime = new Date(`${date}T${workingDay.opensAt}:00`);
    const endTime = new Date(`${date}T${workingDay.closesAt}:00`);
    const slots = [];
    while (startTime < endTime) {
        slots.push({
            startTime: startTime.toISOString(),
            endTime: new Date(startTime.getTime() + slotDuration * 60 * 1000).toISOString(),
            available: true
        });
        startTime.setMinutes(startTime.getMinutes() + slotDuration);
    }

    for (const slot of slots) {
        for (const appointment of appointments) {
            if ((slot.startTime < appointment.slotEnd && slot.endTime > appointment.slotStart) || (slot.startTime == appointment.slotStart && slot.endTime == appointment.slotEnd)) {
                slot.available = false;
                break;
            }
        }
    }

    return slots;
}

const getQueueAvailability = async (service, date, workingDay, queue, existing, items) => {
    if (!queue) {
        return { available: true, position: 1, estimatedStartTime: new Date(), message: "Queue is empty now" }
    }

    if (!queue.status == "ACTIVE") {
        return { available: false, position: null, estimatedStartTime: null, message: `Queue is ${queue.status.toLowerCase()}` }
    }

    if (existing) {
        return { available: false, position: null, estimatedStartTime: existing.estimatedStartTime, message: "You are already in queue" }
    }

    const inProgress = items.find(item => item.status == "IN_PROGRESS")
    const ahead = items.filter(item => item.status == "WAITING")
    const effectiveDuration = service.avgDurationMinutes + service.bufferMinutes;
    let remainingTime = 0;
    if (inProgress?.actualStartTime) {
        const elapsedMinutes =
            (Date.now() - inProgress.actualStartTime.getTime()) / 60000;
        remainingTime = Math.max(0, effectiveDuration - elapsedMinutes);
    }
    const waitMinutes = remainingTime + ahead.length * effectiveDuration;
    const estimatedStartTime = new Date(
        Date.now() + waitMinutes * 60000
    );
    const closingTime = new Date(
        `${date}T${workingDay.closesAt}:00`
    );
    if (estimatedStartTime > closingTime) {
        return { available: false, position: ahead.length + 1, estimatedStartTime: estimatedStartTime, message: "Estimated service time exceeds today's working hours. Please book an appointment for another day" }
    }
    return { available: true, position: ahead.length + 1, estimatedStartTime: estimatedStartTime, message: "You can join the queue" }
}

export {getSlotAvailability, getQueueAvailability}