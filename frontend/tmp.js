const fs = require('fs');
let c = fs.readFileSync('src/app/dashboard/dental/components/PatientDetail.tsx', 'utf8');

c = c.replace(/import \{ useToast \} from "@\/components\/ui\/use-toast";/g, 'import { toast } from "sonner";');
c = c.replace(/\s*const \{ toast \} = useToast\(\);/g, '');

c = c.replace(/toast\(\{ title: "([^"]+)", description: (.*?) \}\);/g, 'toast.success($2);');
c = c.replace(/toast\(\{ variant: "destructive", title: "([^"]+)", description: (.*?) \}\);/g, 'toast.error($2);');

fs.writeFileSync('src/app/dashboard/dental/components/PatientDetail.tsx', c);
console.log("Replaced");
