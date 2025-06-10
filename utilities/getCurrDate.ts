export function getCurrDate(){
    return new Date().toISOString().substring(0, 10)
}