export const generateStudentEmail = (rollnumber) => {
    // const campusCodes = {
    //   F: 'cfd',
    //   I: 'isb',
    //   L: 'lhr',
    //   P: 'pwr',
    //   K: 'khi',
    // };
  
    const batch = rollnumber.substring(0, 2);
    const campus = rollnumber[2].toLowerCase();
    const studentNumber = rollnumber.substring(4);
    
    return `${campus}${batch}${studentNumber}@cfd.nu.edu.pk`;
    //return `${campus}${batch}${studentNumber}@${campusCodes[campus]}.nu.edu.pk`;
};