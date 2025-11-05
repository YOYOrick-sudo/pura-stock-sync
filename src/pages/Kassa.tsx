const Kassa = () => {
  return (
    <div className="min-h-screen bg-[#F5F7DD] p-4 sm:p-6">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl sm:text-3xl font-heading font-bold text-[#282E3A] mb-6">
          Kassatelling — invoer
        </h1>
        
        <div className="bg-white rounded-xl shadow-sm border border-[#1B7867]/10 overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#1B7867]/10 bg-[#F5F7DD]/20">
                <th className="px-3 py-3 sm:px-4 sm:py-3 text-left font-heading font-bold text-[#282E3A]/70 text-xs sm:text-sm uppercase tracking-wide">
                  Denominatie
                </th>
                <th className="px-3 py-3 sm:px-4 sm:py-3 text-center font-heading font-bold text-[#282E3A]/70 text-xs sm:text-sm uppercase tracking-wide">
                  Aantal
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1B7867]/5">
              <tr>
                <td className="px-3 py-3 sm:px-4 text-[#282E3A] font-mono">€500</td>
                <td className="px-3 py-3 sm:px-4 text-center">
                  <input type="number" defaultValue={0} min={0} className="w-20 sm:w-24 px-2 py-1 text-center border border-[#1B7867]/20 rounded-md focus:outline-none focus:border-[#1B7867] font-mono" />
                </td>
              </tr>
              <tr>
                <td className="px-3 py-3 sm:px-4 text-[#282E3A] font-mono">€200</td>
                <td className="px-3 py-3 sm:px-4 text-center">
                  <input type="number" defaultValue={0} min={0} className="w-20 sm:w-24 px-2 py-1 text-center border border-[#1B7867]/20 rounded-md focus:outline-none focus:border-[#1B7867] font-mono" />
                </td>
              </tr>
              <tr>
                <td className="px-3 py-3 sm:px-4 text-[#282E3A] font-mono">€100</td>
                <td className="px-3 py-3 sm:px-4 text-center">
                  <input type="number" defaultValue={0} min={0} className="w-20 sm:w-24 px-2 py-1 text-center border border-[#1B7867]/20 rounded-md focus:outline-none focus:border-[#1B7867] font-mono" />
                </td>
              </tr>
              <tr>
                <td className="px-3 py-3 sm:px-4 text-[#282E3A] font-mono">€50</td>
                <td className="px-3 py-3 sm:px-4 text-center">
                  <input type="number" defaultValue={0} min={0} className="w-20 sm:w-24 px-2 py-1 text-center border border-[#1B7867]/20 rounded-md focus:outline-none focus:border-[#1B7867] font-mono" />
                </td>
              </tr>
              <tr>
                <td className="px-3 py-3 sm:px-4 text-[#282E3A] font-mono">€20</td>
                <td className="px-3 py-3 sm:px-4 text-center">
                  <input type="number" defaultValue={0} min={0} className="w-20 sm:w-24 px-2 py-1 text-center border border-[#1B7867]/20 rounded-md focus:outline-none focus:border-[#1B7867] font-mono" />
                </td>
              </tr>
              <tr>
                <td className="px-3 py-3 sm:px-4 text-[#282E3A] font-mono">€10</td>
                <td className="px-3 py-3 sm:px-4 text-center">
                  <input type="number" defaultValue={0} min={0} className="w-20 sm:w-24 px-2 py-1 text-center border border-[#1B7867]/20 rounded-md focus:outline-none focus:border-[#1B7867] font-mono" />
                </td>
              </tr>
              <tr>
                <td className="px-3 py-3 sm:px-4 text-[#282E3A] font-mono">€5</td>
                <td className="px-3 py-3 sm:px-4 text-center">
                  <input type="number" defaultValue={0} min={0} className="w-20 sm:w-24 px-2 py-1 text-center border border-[#1B7867]/20 rounded-md focus:outline-none focus:border-[#1B7867] font-mono" />
                </td>
              </tr>
              <tr>
                <td className="px-3 py-3 sm:px-4 text-[#282E3A] font-mono">€2</td>
                <td className="px-3 py-3 sm:px-4 text-center">
                  <input type="number" defaultValue={0} min={0} className="w-20 sm:w-24 px-2 py-1 text-center border border-[#1B7867]/20 rounded-md focus:outline-none focus:border-[#1B7867] font-mono" />
                </td>
              </tr>
              <tr>
                <td className="px-3 py-3 sm:px-4 text-[#282E3A] font-mono">€1</td>
                <td className="px-3 py-3 sm:px-4 text-center">
                  <input type="number" defaultValue={0} min={0} className="w-20 sm:w-24 px-2 py-1 text-center border border-[#1B7867]/20 rounded-md focus:outline-none focus:border-[#1B7867] font-mono" />
                </td>
              </tr>
              <tr>
                <td className="px-3 py-3 sm:px-4 text-[#282E3A] font-mono">€0,50</td>
                <td className="px-3 py-3 sm:px-4 text-center">
                  <input type="number" defaultValue={0} min={0} className="w-20 sm:w-24 px-2 py-1 text-center border border-[#1B7867]/20 rounded-md focus:outline-none focus:border-[#1B7867] font-mono" />
                </td>
              </tr>
              <tr>
                <td className="px-3 py-3 sm:px-4 text-[#282E3A] font-mono">€0,20</td>
                <td className="px-3 py-3 sm:px-4 text-center">
                  <input type="number" defaultValue={0} min={0} className="w-20 sm:w-24 px-2 py-1 text-center border border-[#1B7867]/20 rounded-md focus:outline-none focus:border-[#1B7867] font-mono" />
                </td>
              </tr>
              <tr>
                <td className="px-3 py-3 sm:px-4 text-[#282E3A] font-mono">€0,10</td>
                <td className="px-3 py-3 sm:px-4 text-center">
                  <input type="number" defaultValue={0} min={0} className="w-20 sm:w-24 px-2 py-1 text-center border border-[#1B7867]/20 rounded-md focus:outline-none focus:border-[#1B7867] font-mono" />
                </td>
              </tr>
              <tr>
                <td className="px-3 py-3 sm:px-4 text-[#282E3A] font-mono">€0,05</td>
                <td className="px-3 py-3 sm:px-4 text-center">
                  <input type="number" defaultValue={0} min={0} className="w-20 sm:w-24 px-2 py-1 text-center border border-[#1B7867]/20 rounded-md focus:outline-none focus:border-[#1B7867] font-mono" />
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="mt-6 bg-white rounded-xl shadow-sm border border-[#1B7867]/10 p-4 sm:p-6">
          <div className="flex items-center justify-between">
            <span className="text-lg sm:text-xl font-heading font-bold text-[#282E3A]">
              Totaal
            </span>
            <span className="text-2xl sm:text-3xl font-heading font-bold text-[#1B7867]">
              €0,00
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Kassa;
